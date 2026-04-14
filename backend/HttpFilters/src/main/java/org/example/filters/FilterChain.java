package org.example.filters;

import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.filter.OncePerRequestFilter;

import java.util.List;
import java.util.logging.Filter;

public class FilterChain {
    private List<Filter> filters;
    private int index = 0;

    public void doFilter(ServletRequest request, ServletResponse response) {
        if(index < filters.size()){
            Filter next = filters.get(index++);
            next.doFilter(request, response, this);
        }
    }
}

class MyFilter extends OncePerRequestFilter{
    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse response, FilterChain chain){
        
    }
}
