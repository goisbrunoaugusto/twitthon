interface PaginationProps {
    page: number;
    totalPages: number;
    hasPrev: boolean;
    hasNext: boolean;
    onPrevPage?: () => void;
    onNextPage?: () => void;
}

const Pagination = ({
    page,
    totalPages,
    hasPrev,
    hasNext,
    onPrevPage,
    onNextPage,
}: PaginationProps) => (
    <div className="flex justify-center items-center gap-2 mt-4">
        <button
            className="btn btn-sm"
            disabled={!hasPrev}
            onClick={onPrevPage}
        >
            Previous
        </button>
        <span className="mx-2">
            Page {page} of {totalPages || 1}
        </span>
        <button
            className="btn btn-sm"
            disabled={!hasNext}
            onClick={onNextPage}
        >
            Next
        </button>
    </div>
);

export default Pagination;