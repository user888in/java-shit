package org.example.model;

public class PageRequest {
    private int pageNumber; // which page
    private int pageSize; // records per page

    public PageRequest(int pageNumber, int pageSize) {
        if (pageNumber < 1) pageNumber = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 100) pageSize = 100; // prevent too many records
        this.pageNumber = pageNumber;
        this.pageSize = pageSize;
    }

    public int getOfset() {
        return (pageNumber - 1) * pageSize;
    }

    public int getLimit() {
        return this.pageSize;
    }

    public int getPageNumber() {
        return  this.pageNumber;
    }

    public int getPageSize() {
        return this.pageSize;
    }

}
