package  org.example;

import javax.swing.*;
import java.awt.*;

public class LoginPanel extends JPanel {

    public LoginPanel(MainFrame frame) {
        setLayout(new BorderLayout());

        JLabel title = new JLabel("Login Page", JLabel.CENTER);
        title.setFont(new Font("Arial", Font.BOLD, 24));

        JButton loginButton = new JButton("Login");

        loginButton.addActionListener(e -> {
            frame.showPage(MainFrame.DASHBOARD);
        });

        add(title, BorderLayout.CENTER);
        add(loginButton, BorderLayout.SOUTH);
    }
}