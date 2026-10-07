export type SelectOption<T extends string = string> = {
	value: T;
	label: string;
	icon?: string;
};
