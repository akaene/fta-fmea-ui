import React, { FC } from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  useTheme,
  Tooltip,
  Typography,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { useTranslation } from "react-i18next";
import useStyles from "./FaultTreeOverviewTable.styles";
import { FaultTree } from "@models/faultTreeModel";
import { useNavigate } from "react-router-dom";
import { ROUTES, Status } from "@utils/constants";
import { extractFragment } from "@services/utils/uriIdentifierUtils";
import { System } from "@models/systemModel";
import { getFilteredFaultTreesBySystem, getReorderedSystemsListbySystem, formatDate } from "@utils/utils";
import { useSelectedSystemSummaries } from "@hooks/useSelectedSystemSummaries";

const faultTreeTableHeadCells = [
  "faultTreeOverviewTable.name",
  "faultTreeOverviewTable.aircraftType",
  "faultTreeOverviewTable.sns",
  "faultTreeOverviewTable.calculatedFailureRate",
  "faultTreeOverviewTable.fhaBasedFailureRate",
  "faultTreeOverviewTable.requiredFailureRate",
  "faultTreeOverviewTable.lastModified",
  "faultTreeOverviewTable.created",
  "faultTreeOverviewTable.lastEditor",
  // "faultTreeOverviewTable.status", Unused
];

const systemTableHeadCells = ["faultTreeOverviewTable.name", "faultTreeOverviewTable.operationalHours"];

interface FaultTreeOverviewTableProps {
  faultTrees?: FaultTree[];
  systems?: System[];
  handleFaultTreeContextMenu?: (evt: any, faultTree: FaultTree) => void;
  handleSystemContextMenu?: (evt: any, system: System) => void;
}

const FaultTreeAndSystemOverviewTable: FC<FaultTreeOverviewTableProps> = ({
  faultTrees,
  systems,
  handleFaultTreeContextMenu,
  handleSystemContextMenu,
}) => {
  const navigate = useNavigate();
  const { classes } = useStyles();
  const { t } = useTranslation();
  const theme = useTheme();

  const [selectedSystem, setSelectedSystem] = useSelectedSystemSummaries();
  const modifiedSystemsList = getReorderedSystemsListbySystem(systems, selectedSystem);
  const modifiedFaultTreesList = getFilteredFaultTreesBySystem(faultTrees, selectedSystem);

  const redirectToPath = (routePath: string, system: System) => {
    setSelectedSystem(system);
    navigate(routePath);
  };
  const failureRate = (fr: number) => {
    return (
      <Tooltip title={fr}>
        <Typography>{fr?.toExponential(2)}</Typography>
      </Tooltip>
    );
  };

  return (
    <Box className={classes.tableContainer}>
      <TableContainer>
        <Table className={classes.table}>
          <TableHead>
            <TableRow>
              {faultTrees &&
                faultTreeTableHeadCells.map((headCell, index) => {
                  const styling = index === 0 ? classes.firstColumn : classes.tableHeaderCell;
                  return (
                    <>
                      <TableCell key={index} className={styling}>
                        {t(headCell)}
                      </TableCell>
                      {faultTreeTableHeadCells.length - 1 === index && <TableCell></TableCell>}
                    </>
                  );
                })}
              {systems &&
                systemTableHeadCells.map((headCell, index) => {
                  const styling = index === 0 ? classes.systemFirstColumn : classes.tableHeaderCell;
                  return (
                    <>
                      <TableCell key={index} className={styling}>
                        {t(headCell)}
                      </TableCell>
                      {systemTableHeadCells.length - 1 === index && <TableCell></TableCell>}
                    </>
                  );
                })}
            </TableRow>
          </TableHead>
          <TableBody>
            {/* Will be changed and refactored in the future task with more data */}
            {faultTrees &&
              modifiedFaultTreesList.map((faultTree, rowIndex) => {
                const routePath = ROUTES.FTA + `/${extractFragment(faultTree.iri)}`;
                const statusColor = faultTree?.status !== Status.OK ? "red" : "white";
                return (
                  <TableRow key={rowIndex} className={classes.noBorder}>
                    <TableCell className={classes.firstColumn}>{faultTree.name}</TableCell>
                    <TableCell className={classes.tableCell}>{faultTree?.system?.name}</TableCell>
                    <TableCell className={classes.tableCell}>{faultTree?.subSystem?.name}</TableCell>
                    <TableCell style={{ color: statusColor }} className={classes.tableCell}>
                      {failureRate(faultTree?.calculatedFailureRate)}
                    </TableCell>
                    <TableCell className={classes.tableCell}>{failureRate(faultTree?.fhaBasedFailureRate)}</TableCell>
                    <TableCell className={classes.tableCell}>{failureRate(faultTree?.requiredFailureRate)}</TableCell>
                    <TableCell className={classes.tableCell}>{formatDate(faultTree?.modified)}</TableCell>
                    <TableCell className={classes.tableCell}>{formatDate(faultTree?.created)}</TableCell>
                    <TableCell className={classes.tableCell}>{faultTree?.editor?.username}</TableCell>
                    <TableCell className={classes.tableCell}>
                      <Box className={classes.rowOptionsContainer}>
                        <Button
                          variant="contained"
                          className={classes.editButton}
                          onClick={() => redirectToPath(routePath, faultTree?.system)}
                        >
                          {t("faultTreeOverviewTable.edit")}
                        </Button>
                        <MoreVertIcon
                          className={classes.moreButton}
                          onClick={(e: any) => handleFaultTreeContextMenu(e, faultTree)}
                        />
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            {systems &&
              modifiedSystemsList.map((system, rowIndex) => {
                const routePath = ROUTES.SYSTEMS + `/${extractFragment(system.iri)}`;
                const bgColor = system?.iri === selectedSystem?.iri ? theme.sidePanel.colors.hover : "transparent";
                return (
                  <TableRow key={rowIndex} className={classes.noBorder} style={{ backgroundColor: bgColor }}>
                    <TableCell className={classes.systemFirstColumn}>{system.name}</TableCell>
                    <TableCell className={classes.tableCell}>
                      {system.operationalDataFilter.minOperationalHours}
                    </TableCell>
                    <TableCell className={classes.tableCell}>
                      <Box className={classes.rowOptionsContainer}>
                        <Button
                          variant="contained"
                          className={classes.editButton}
                          onClick={() => redirectToPath(routePath, system)}
                        >
                          {t("faultTreeOverviewTable.edit")}
                        </Button>
                        <MoreVertIcon
                          className={classes.moreButton}
                          onClick={(e: any) => handleSystemContextMenu(e, system)}
                        />
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default FaultTreeAndSystemOverviewTable;
