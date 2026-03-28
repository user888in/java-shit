<%@ page language="java" contentType="text/html; charset=UTF-8"
    pageEncoding="UTF-8"%>
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Insert title here</title>
</head>
<body>
	<form method="post" action="FileUploadServlet" enctype="multipart/form-data">
		Enter name : <input type="text" name="text_name">
		Upload File : <input type="file" name="file_upload">
		<input type="submit" value="Upload">
	</form>
	<form method="get" action="">
    Enter ID: <input type="number" name="id">
    <input type="submit" value="Show Image">
</form>
	<%
		String id = request.getParameter("id");	
		if(id != null){
	%>
		<img src="DisplayImageServlet?id=<%=id%>" width="300">
	<%
		}
	%>
</body>
</html>