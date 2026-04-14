<%@page import="java.sql.PreparedStatement"%>
<%@page import="java.sql.Connection"%>
<%@ page language="java" contentType="text/html; charset=UTF-8"
    pageEncoding="UTF-8"%>
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Insert title here</title>
</head>
<body>
	<div>
		<form method="post" action="Insertion.jsp">
			<input type="text" name="text_name"> 
			<input type="number" name="text_salary"> 
			<input type="submit" value="Inset">
		</form>
	</div>
	<%
	
		String name = request.getParameter("text_name");
		double salary = Double.parseDouble(request.getParameter("text_salary"));
		
		Connection cn = (Connection) application.getAttribute("connection");
		PreparedStatement ps = cn.prepareStatement("insert into employee(name, salary) values(?,?)");
		ps.setString(1, name);
		ps.setDouble(2, salary);
		int a = ps.executeUpdate();
		if(a>0){
	
        response.sendRedirect("ShowInformation.jsp");
	
		}
	%>

</body>
</html>