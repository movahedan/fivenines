export type PackageExportValue =
	| string
	| {
			readonly types: string;
			readonly import: string;
			readonly default: string;
	  };

export function toSourceExport(exportPath: string): PackageExportValue {
	if (exportPath.endsWith(".css")) {
		return exportPath;
	}

	return {
		types: exportPath,
		import: exportPath,
		default: exportPath,
	};
}
