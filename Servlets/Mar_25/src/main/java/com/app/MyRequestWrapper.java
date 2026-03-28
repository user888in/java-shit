package com.app;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;

public class MyRequestWrapper extends HttpServletRequestWrapper {

	HttpServletRequest req;

	public MyRequestWrapper(HttpServletRequest request) {
		super(request);
		this.req = request;
	}

	@Override
	public String getParameter(String name) {
		// TODO Auto-generated method stub
		String value = "";
		if (req.getParameter(name) == null) {
			value = "NONE";
		}
		return value;
	}
}
