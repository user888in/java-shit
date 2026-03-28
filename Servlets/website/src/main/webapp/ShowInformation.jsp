<%@page import="java.sql.ResultSet"%>
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

	<%
	Connection cn = (Connection) application.getAttribute("connection");
	PreparedStatement ps = cn.prepareStatement("select * from employee");
	ResultSet rs = ps.executeQuery();
	%>
	<table cellpadding="2" cellspacing="0" width="70%" border="1">

		<%

		%>

		<tr>
		<th><%=rs.getMetaData().getColumnLabel(1)%></th>
		<th><%=rs.getMetaData().getColumnLabel(2)%></th>
		<th><%=rs.getMetaData().getColumnLabel(3)%></th>
		</tr>
<%
while (rs.next()) {
%>
			<tr>
			<td><%=rs.getString(1)%></td>
			<td><%=rs.getString(2)%></td>
			<td><%=rs.getString(3)%></td>
		</tr>
			<%
			}
			%>
</table>
</body>
</html>