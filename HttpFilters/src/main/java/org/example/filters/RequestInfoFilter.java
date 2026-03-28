package org.example.filters;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;


public class RequestInfoFilter extends OncePerRequestFilter {
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        // http servlet request not servlet request
        String method = request.getMethod(); // HTTP methods: GET POST PUT DELETE
        String uri = request.getRequestURI(); // HTTP request url path
        String clientIP = request.getRemoteAddr(); // the client ip
        String userAgent = request.getHeader("User-Agent"); // the browser/client's info

        filterChain.doFilter(request, response); // pass to the next filter/controller
        // post processing after the controller before the response sent
        int statusCode = response.getStatus();
        System.out.println("Status code: " + statusCode);
    }
}
