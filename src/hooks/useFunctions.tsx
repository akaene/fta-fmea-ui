import * as React from "react";
import {createContext, useContext, useEffect, useState} from "react";

import {CreateFunction, Function} from "@models/functionModel";
import * as componentService from "@services/componentService"
import {axiosSource} from "@services/utils/axiosUtils";
import {SnackbarType, useSnackbar} from "./useSnackbar";


type functionContextType = [Function[], (f: CreateFunction) => void];

export const functionsContext = createContext<functionContextType>(null!);

export const useFunctions = () => {
    const [functions, addFunction] = useContext(functionsContext);
    return [functions, addFunction] as const;
}

type FunctionProviderProps = {
    children: React.ReactNode,
    componentUri: string
};

export const FunctionsProvider = ({children, componentUri}: FunctionProviderProps) => {
    const [_function, _setFunctions] = useState<Function[]>([]);
    const [showSnackbar] = useSnackbar()

    const addFunction = async (f: CreateFunction) => {
        componentService.addFunction(componentUri, f)
            .then(value => {
                _setFunctions([..._function, value])
                showSnackbar('Function created', SnackbarType.SUCCESS)
            }).catch(reason => showSnackbar(reason, SnackbarType.ERROR))
    }

    useEffect(() => {
        const fetchFunctions = async () => {
            if (componentUri) {
                componentService.functions(componentUri)
                    .then(value => _setFunctions(value))
                    .catch(reason => showSnackbar(reason, SnackbarType.ERROR))
            }
        }

        fetchFunctions()

        return () => {
            axiosSource.cancel("FunctionsProvider - unmounting")
        }
    }, [componentUri]);

    return (
        <functionsContext.Provider value={[_function, addFunction]}>
            {children}
        </functionsContext.Provider>
    );
}