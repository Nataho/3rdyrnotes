export interface DocsExportSettings {
	siteName: string;
	lastExportPath: string;
	rememberPath: boolean;
	/** Vault-relative file/folder paths the user explicitly included (empty list = everything) */
	include: string[];
	/** Vault-relative file/folder paths the user excluded (wins over include) */
	exclude: string[];
	contentWidth: number;
	showBreadcrumbs: boolean;
	showLastUpdated: boolean;
	showPagination: boolean;
	enableMermaid: boolean;
}

export const DEFAULT_LAST_EXPORT_PATH = 'C:\\xampp\\htdocs\\notes';

export const DEFAULT_SETTINGS: DocsExportSettings = {
	siteName: 'Docs',
	lastExportPath: DEFAULT_LAST_EXPORT_PATH,
	rememberPath: true,
	include: [],
	exclude: ['.trash'],
	contentWidth: 760,
	showBreadcrumbs: true,
	showLastUpdated: true,
	showPagination: true,
	enableMermaid: true,
};
