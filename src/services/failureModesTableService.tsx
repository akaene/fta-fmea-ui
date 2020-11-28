import JsonLdUtils from "@utils/JsonLdUtils";
import {authHeaders} from "@services/utils/authUtils";
import axiosClient from "@services/utils/axiosUtils";
import {
    FailureModesTable,
    CONTEXT,
    UpdateFailureModesTable,
    FailureModesTableData
} from "@models/failureModesTableModel";
import {extractFragment} from "@services/utils/uriIdentifierUtils";
import {FaultEvent} from "@models/eventModel";
import {FailureModesRow} from "@models/failureModesRowModel";
import VocabularyUtils from "@utils/VocabularyUtils";
import {RiskPriorityNumber} from "@models/rpnModel";

export const findAll = async (): Promise<FailureModesTable[]> => {
    try {
        const response = await axiosClient.get<FailureModesTable[]>(
            '/failureModesTable',
            {
                headers: authHeaders()
            }
        )

        return JsonLdUtils.compactAndResolveReferencesAsArray<FailureModesTable>(response.data, CONTEXT)
    } catch (e) {
        console.log('Failure Modes Table Service - Failed to call /findAll')
        return new Promise((resolve, reject) => reject("Failed to load failure modes tables"));
    }
}

export const update = async (table: UpdateFailureModesTable): Promise<FailureModesTable> => {
    try {
        const response = await axiosClient.put(
            '/failureModesTable',
            table,
            {
                headers: authHeaders()
            }
        )

        return JsonLdUtils.compactAndResolveReferences<FailureModesTable>(response.data, CONTEXT);
    } catch (e) {
        console.log('Failure Modes Table Service - Failed to call /update')
        return new Promise((resolve, reject) => reject("Failed to failure modes tables"));
    }
}

export const remove = async (tableIri: string): Promise<void> => {
    try {
        const fragment = extractFragment(tableIri);

        await axiosClient.delete(
            `/failureModesTable/${fragment}`,
            {
                headers: authHeaders()
            }
        )
        return new Promise((resolve) => resolve());
    } catch (e) {
        console.log('Failure Modes Table Service - Failed to call /remove')
        return new Promise((resolve, reject) => reject("Failed to remove failure modes tables"));
    }
}

export const computeTableData = async (tableIri: string): Promise<FailureModesTableData> => {
    try {
        const fragment = extractFragment(tableIri);

        const response = await axiosClient.get(
            `/failureModesTable/${fragment}/computeTableData`,
            {
                headers: authHeaders()
            }
        );
        return new Promise((resolve) => resolve(response.data));
    } catch (e) {
        console.log('Failure Modes Table Service - Failed to call /computeTableData')
        return new Promise((resolve, reject) => reject("Failed to load failure modes table data"));
    }
}

export const exportCsv = async (tableIri: string, title: string): Promise<string> => {
    try {
        const fragment = extractFragment(tableIri);

        const response = await axiosClient.get(
            `/failureModesTable/${fragment}/export`,
            {
                headers: authHeaders()
            }
        );

        const type = response.headers['content-type']
        const blob = new Blob([response.data], { type: type})
        const link = document.createElement('a')
        link.href = window.URL.createObjectURL(blob)
        link.download = title + ".csv";
        link.click()
    } catch (e) {
        console.log('Failure Modes Table Service - Failed to call /exportCsv')
        return new Promise((resolve, reject) => reject("Failed to export table data"));
    }
}


export const eventPathsToRows = (eventPathsMap: Map<number, FaultEvent[]>, rpnsMap: Map<number, RiskPriorityNumber>): FailureModesRow[] => {
    return Array.from(eventPathsMap).map(([key, path]) => {
        const rpn = rpnsMap.get(key)
        return {
            "@type": [VocabularyUtils.FAILURE_MODES_ROW],
            localEffect: path[0],
            effects: (path.length > 1) ? path.slice(1) : [],
            rpn: {
                "@type": [VocabularyUtils.RPN],
                severity: rpn?.severity,
                occurrence: rpn?.occurrence,
                detection: rpn?.detection,
            },
        } as FailureModesRow;
    });
}