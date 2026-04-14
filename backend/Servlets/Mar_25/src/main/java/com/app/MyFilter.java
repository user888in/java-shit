package com.app;

import java.io.IOException;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

public class MyFilter implements Filter {

	@Override
	public void doFilter(ServletRequest req, ServletResponse resp, FilterChain fc)
			throws IOException, ServletException {
		// TODO Auto-generated method stub
		MyRequestWrapper request = new MyRequestWrapper((HttpServletRequest) req);
		MyResponseWrapper response = new MyResponseWrapper((HttpServletResponse) resp);
		fc.doFilter(request, response);
	}

}
