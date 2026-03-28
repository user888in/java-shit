package org.example;

import java.net.ServerSocket;
import java.net.Socket;

public class Server {
    public static void main(String args[]) throws Exception{
        ServerSocket serverSocket = new ServerSocket(8080);
        System.out.println("Server is running on PORT 8080");
        Socket clientSocket =  serverSocket.accept();
        System.out.println("A new client connected");
        serverSocket.close();
    }
}
