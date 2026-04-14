package org.example.filters;

import jakarta.servlet.*;
import jakarta.servlet.annotation.WebFilter;

import java.io.IOException;

@WebFilter(urlPatterns = "/*")
// url patterns --> run this filter for all the request /api/admin/* for this request
public class
SimpleLoggingFilter implements Filter {
    // filter provides methods to be implemented
    @Override
    public void init(FilterConfig filterConfig) {
        // called once when filter is first created
        // filterConfig -> settings/parameters for this filter
        // used for setting up resources -> db connection, reading configs...
        System.out.println("SimpleLogging Filter init");
    }

    @Override
    public void doFilter(ServletRequest servletRequest, ServletResponse servletResponse, FilterChain filterChain) throws IOException, ServletException {
        // called for every request that comes through
        // runs before the request reaches the controller
        System.out.println("Request incoming");
        long startTime = System.currentTimeMillis();

        filterChain.doFilter(servletRequest, servletResponse);
        // passes request to the next filter in the chain after the last filter it reaches to the controller after controllers response execution returns here (pause point)

        long endTime = System.currentTimeMillis();
        long duration = endTime - startTime;
        System.out.println("Request completed in " + duration + "ms");
    }

    @Override
    public void destroy() {
        // destroy() = called ONCE when the filter is removed/server shuts down
        // to clean up resources -> db connection
        System.out.println("SimpleLoggingFilter destroyed...");

    }
}
