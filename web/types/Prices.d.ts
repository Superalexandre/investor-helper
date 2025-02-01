import type { columns } from "../app/routes/api/prices/parameters";
import type { Period } from "../utils/getPrices"
import type { ColumnType, ColumnTypeMappingType } from "../utils/tradingview/filter";

type FilteredColumnMapping<TColumns extends readonly ColumnType[]> = {
    [K in TColumns[number]]: ColumnTypeMappingType[K];
};

type BestGainerTyped<TColumns extends readonly ColumnType[]> = FilteredColumnMapping<TColumns> & {
    prices: Period[];
    rawChange: number;
};

type BestGainer = BestGainerTyped<typeof columns>;

// // biome-ignore lint/style/useNamingConvention: <explanation>
// type BestLoser<TColumns extends readonly ColumnType[]> = {
// 	[K in TColumns[number]]: ColumnTypeMappingType[K];
// } & {
// 	prices: Period[];
// };

type BestLoserTyped<TColumns extends readonly ColumnType[]> = FilteredColumnMapping<TColumns> & {
	prices: Period[];
    rawChange: number;
};

type BestLoser = BestLoserTyped<typeof columns>;

export type { BestGainer, BestLoser }
