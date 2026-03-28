package org.example.model;

import java.util.List;

public class PageResponse<T> {
    // actual data + meta data
    private List<T> content;
    private int currentPage;
    private int pageSize;
    private long totalRecords; // total records in db for this filter
    private int totalPages;
    private boolean isFirst;
    private boolean isLast;

    public PageResponse(List<T> content, int currentPage, int pageSize, long totalRecords) {
        this.content = content;
        this.currentPage = currentPage;
        this.pageSize = pageSize;
        this.totalRecords = totalRecords;
        this.totalPages = (int) Math.ceil((double) totalRecords / pageSize);
        this.isFirst = (currentPage == 1);
        this.isLast = (currentPage >= totalPages);
    }

    public List<T> getContent() { return content; }
    public int getCurrentPage() { return currentPage; }
    public int getPageSize() { return pageSize; }
    public long getTotalRecords() { return totalRecords; }
    public int getTotalPages() { return totalPages; }
    public boolean isFirst() { return isFirst; }
    public boolean isLast() { return isLast; }

    @Override
    public String toString() {
        return String.format(
                "\n=== Page %d of %d | Showing %d records | Total: %d | First: %b | Last: %b ===",
                currentPage, totalPages, content.size(), totalRecords, isFirst, isLast
        );
    }



}
