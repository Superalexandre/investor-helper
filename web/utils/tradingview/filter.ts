import { z } from "zod"

// Define supported filter operations
const FilterOperationSchema = z.enum(["and", "or"]);
type FilterOperationType = z.infer<typeof FilterOperationSchema>;

// Define the supported field names
const FilterFieldSchema = z.enum([
    "country_code_fund",
    "market_cap_basic",
    "volume",
    "type",
    "typespecs",
    "enterprise_value_current",
]);
type FilterFieldType = z.infer<typeof FilterFieldSchema>;

// Define supported operations for expressions
const ExpressionOperationSchema = z.enum([
    "equal",
    "greater",
    "has",
    "has_none_of",
]);
type ExpressionOperationType = z.infer<typeof ExpressionOperationSchema>;

// Define FilterExpression schema
const FilterExpressionSchema = z.object({
    left: FilterFieldSchema,
    operation: ExpressionOperationSchema,
    right: z.any(), // Right-hand value can be any, depending on the operation
});
type FilterExpression = z.infer<typeof FilterExpressionSchema>;

// Define FilterOperation schema
const FilterOperationSchemaNested = z.object({
    operator: FilterOperationSchema,
    operands: z.array(z.union([FilterExpressionSchema, z.lazy(() => FilterOperationSchemaNested)])),
});
type FilterOperation = z.infer<typeof FilterOperationSchemaNested>;

// Supported `sortBy` values
const SortBySchema = z.enum(["change", "volume", "market_cap_basic"]);
type SortByType = z.infer<typeof SortBySchema>;

const SortOrder = z.enum(["asc", "desc"])
type SortByOrder = z.infer<typeof SortOrder>

// Supported `markets` values
const MarketsSchema = z.array(z.string());
type MarketsType = z.infer<typeof MarketsSchema>;

// Supported `lang` values
const LangSchema = z.enum(["fr", "en"]);
type LangType = z.infer<typeof LangSchema>;

// Helper function to create filter expressions dynamically
const createFilterExpression = <T extends FilterFieldType>(
    left: T,
    operation: ExpressionOperationType,
    right: T extends "typespecs" ? string[] : any
): FilterExpression => {
    return {
        left,
        operation,
        right,
    };
};

// Define logical operators
const and = (...operands: (FilterExpression | FilterOperation)[]): FilterOperation => ({
    operator: "and",
    operands,
});

const or = (...operands: (FilterExpression | FilterOperation)[]): FilterOperation => ({
    operator: "or",
    operands,
});

export {
    FilterOperationSchema,
    FilterFieldSchema,
    ExpressionOperationSchema,
    FilterExpressionSchema,
    FilterOperationSchemaNested,
    SortBySchema,
    SortOrderSchema,
    MarketsSchema,
    LangSchema,
    createFilterExpression,
    and,
    or,
}

export type {
    FilterOperationType,
    FilterFieldType,
    ExpressionOperationType,
    FilterExpression,
    FilterOperation,
    SortByType,
    SortByOrder,
    MarketsType,
    LangType,
}

const buildExampleFilter = () => {
    // Build a filter expression
    const filter = and(
        createFilterExpression("country_code_fund", "equal", "US"),
        or(
            createFilterExpression("market_cap_basic", "greater", 1000000000),
            createFilterExpression("volume", "greater", 1000000),
        ),
    );

    return filter;
};