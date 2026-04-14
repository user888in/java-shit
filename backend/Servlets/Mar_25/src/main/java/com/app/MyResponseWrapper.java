package com.app;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpServletResponseWrapper;

public class MyResponseWrapper extends HttpServletResponseWrapper {
	HttpServletResponse resp;

	public MyResponseWrapper(HttpServletResponse resp) {
		super(resp);
		this.resp = resp;
	}

	@Override
	public void setContentType(String type) {
		// TODO Auto-generated method stub
		if (type.equals("text/xml")) {
			super.setContentType("text/html");
		}
	}

}
