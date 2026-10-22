import * as vscode from "vscode";

const DATE_FORMATTER = new Intl.DateTimeFormat(vscode.env.language, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
});

export function formatDate(date: Date | number) {
    return DATE_FORMATTER.format(date);
}