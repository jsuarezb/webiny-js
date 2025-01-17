import LambdaClient from "aws-sdk/clients/lambda";
import {
    MigrationEventHandlerResponse,
    MigrationInvocationErrorResponse,
    MigrationRun,
    MigrationStatus,
    MigrationStatusResponse
} from "~/types";
import { getMigrationStatus } from "./getMigrationStatus";

interface RunMigrationParams {
    lambdaClient: LambdaClient;
    functionName: string;
    payload?: Record<string, any>;
    statusCallback?: (status: MigrationRun) => void;
}

const getMigrationStatusReportInterval = () => {
    const envKey = "MIGRATION_STATUS_REPORT_INTERVAL";
    if (envKey in process.env) {
        return parseInt(String(process.env[envKey]));
    }
    return 2000;
};

/**
 * Run the migration Lambda, and re-run when resuming is requested.
 */
export const runMigration = async ({
    payload,
    functionName,
    lambdaClient,
    statusCallback
}: RunMigrationParams): Promise<MigrationStatusResponse | MigrationInvocationErrorResponse> => {
    // We don't report status, if `stdout` is not TTY (usually in CIs, and child processes spawned programmatically).
    const reportStatus = (data: MigrationStatus) => {
        if (!process.stdout.isTTY || typeof statusCallback !== "function") {
            return;
        }

        statusCallback(data);
    };

    const invokeMigration = async () => {
        const response = await lambdaClient
            .invoke({
                FunctionName: functionName,
                InvocationType: "Event",
                Payload: JSON.stringify({ ...payload, command: "execute" })
            })
            .promise();

        return response.StatusCode;
    };

    // Execute migration function.
    await invokeMigration();

    // Poll for status and re-execute when migration is in "pending" state.
    let response: MigrationEventHandlerResponse;
    while (true) {
        await new Promise(resolve => setTimeout(resolve, getMigrationStatusReportInterval()));

        response = await getMigrationStatus({
            payload,
            functionName,
            lambdaClient
        });

        if (!response) {
            continue;
        }

        const { data, error } = response;

        // If we received an error, it must be an unrecoverable error, and we don't retry.
        if (error) {
            return response;
        }

        switch (data.status) {
            case "init":
                reportStatus(data);
                continue;
            case "pending":
                await invokeMigration();
                break;
            case "running":
                reportStatus(data);
                break;
            case "done":
            default:
                return response;
        }
    }
};
