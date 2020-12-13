import {useEffect, useRef, useState} from "react";
import * as React from "react";
import useStyles from "../../EditorCanvas.styles";
import * as joint from 'jointjs';
import * as dagre from 'dagre';
import * as graphlib from 'graphlib';
import {useLocalContext} from "@hooks/useLocalContext";
import {V} from "jointjs";
import {System} from "@models/systemModel";
import {Component} from "@models/componentModel";
import {flatten, cloneDeep} from "lodash";
import ComponentShape from "@components/editor/system/shapes/ComponentShape";
import {handleCanvasMouseWheel} from "@utils/canvasZoom";
import DiagramOptions from "@components/editor/menu/DiagramOptions";
import SidebarMenu from "@components/editor/faultTree/menu/SidebarMenu";
import ComponentSidebarMenu from "@components/editor/system/menu/component/ComponentSidebarMenu";
import {SystemLink} from "@components/editor/system/shapes/shapesDefinitions";
import * as svgService from "@services/svgService";
import {SnackbarType, useSnackbar} from "@hooks/useSnackbar";

interface Props {
    system: System,
    sidebarSelectedComponent: Component,
    onBlankContextMenu: (evt: any) => void,
    onElementContextMenu: (element: any, evt: any) => void,
    onComponentUpdated: (component: Component) => void,
}

const EditorCanvas = ({system, sidebarSelectedComponent, onBlankContextMenu, onElementContextMenu, onComponentUpdated}: Props) => {
    const classes = useStyles()
    const [showSnackbar] = useSnackbar();

    const containerRef = useRef(null)

    const [container, setContainer] = useState<joint.dia.Graph>()

    const [dragStartPosition, setDragStartPosition] = useState<{ x: number, y: number } | null>(null)
    const localContext = useLocalContext({dragStartPosition})

    useEffect(() => {
        const canvasWidth = containerRef.current.clientWidth;
        const canvasHeight = containerRef.current.clientHeight;

        const graph = new joint.dia.Graph;
        const divContainer = document.getElementById("jointjs-system-container");
        const paper = new joint.dia.Paper({
            // @ts-ignore
            el: divContainer,
            model: graph,
            width: canvasWidth,
            height: canvasHeight,
            gridSize: 10,
            drawGrid: true,
            defaultConnectionPoint: {name: 'boundary', args: {extrapolate: true}},
            defaultConnector: {name: 'rounded'},
            defaultRouter: {name: 'orthogonal'},
        })

        // @ts-ignore
        paper.on({
            'blank:contextmenu': (evt) => {
                onBlankContextMenu(evt);
            },
            'element:contextmenu': (elementView, evt) => {
                onElementContextMenu(elementView, evt)
            },
            // Zoom in,out
            'cell:mousewheel': (cellView, evt, x, y, delta) => {
                handleCanvasMouseWheel(evt, x, y, delta, paper)
            },
            'blank:mousewheel': (evt, x, y, delta) => {
                handleCanvasMouseWheel(evt, x, y, delta, paper)
            },
            // Canvas dragging
            'blank:pointerdown': (evt, x, y) => {
                const scale = V(paper.viewport).scale();
                setDragStartPosition({x: x * scale.sx, y: y * scale.sy})
            },
            'cell:pointerup blank:pointerup': () => setDragStartPosition(null),
        })

        divContainer.addEventListener('mousemove', e => {
            // @ts-ignore
            if (localContext.dragStartPosition) {
                // @ts-ignore
                paper.translate(e.offsetX - localContext.dragStartPosition.x, e.offsetY - localContext.dragStartPosition.y);
            }
        })

        setContainer(graph)
    }, []);

    const [componentShapesMap, setComponentShapesMap] = useState<Map<string, any>>(new Map());
    const [componentLinksMap, setComponentLinksMap] = useState<Map<string, string>>(new Map());

    const addSelf = (componentIri: string, shape: any) => {
        shape.addTo(container)
        layout(container)

        setComponentShapesMap(prevMap => {
            const mapClone = cloneDeep(prevMap);
            mapClone.set(componentIri, shape);
            return mapClone;
        })
    }

    const layout = (graph) => {
        joint.layout.DirectedGraph.layout(graph, {
            rankDir: "RL",
            dagre: dagre,
            graphlib: graphlib,
            setVertices: true,
            marginX: 20,
            marginY: 20
        });
    }

    const handleDiagramExport = () => {
        const svgPaper = document.querySelector('#jointjs-system-container > svg');
        const svgString = new XMLSerializer().serializeToString(svgPaper);
        svgService.exportPng(svgString, system?.name)
            .catch(reason => showSnackbar(reason, SnackbarType.ERROR));
    }


    const addLink = (componentIri: string, linkedComponentIri: string) => {
        setComponentLinksMap(prevMap => {
            const mapClone = cloneDeep(prevMap);
            mapClone.set(componentIri, linkedComponentIri);
            return mapClone;
        })
    }

    const removeSelf = (componentIri: string, shape: any) => {
        setComponentLinksMap(prevMap => {
            const mapClone = cloneDeep(prevMap);
            mapClone.delete(componentIri);
            return mapClone;
        })
        shape.remove();
    }

    useEffect(() => {
        drawLinks(componentShapesMap, componentLinksMap)
    }, [componentShapesMap, componentLinksMap])

    const drawLinks = (componentShapesMap, componentLinksMap) => {
        componentLinksMap.forEach((sourceIri, targetIri) => {
            const sourceShape = componentShapesMap.get(sourceIri)
            const targetShape = componentShapesMap.get(targetIri)
            if (sourceShape && targetShape) {
                const link = new SystemLink();

                link.source(targetShape);
                link.target(sourceShape);
                link.addTo(container);
            }
        })
        if (container) {
            layout(container)
        }
    }

    return (
        <div className={classes.root}>
            <div id="jointjs-system-container" className={classes.konvaContainer} ref={containerRef}>
                {container && system &&
                flatten([system.components])
                    .map(value => <ComponentShape key={value.iri} component={value}
                                                  addSelf={addSelf} addLink={addLink} removeSelf={removeSelf}/>)
                }
            </div>
            <SidebarMenu className={classes.sidebar}>
                <DiagramOptions onRestoreLayout={() => layout(container)} onExportDiagram={handleDiagramExport}/>
                {system && <ComponentSidebarMenu
                    component={sidebarSelectedComponent}
                    onComponentUpdated={onComponentUpdated}
                    systemComponents={system?.components}
                />}
            </SidebarMenu>
        </div>
    );
}

export default EditorCanvas;