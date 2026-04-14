package org.example;
import javax.swing.*;
import java.awt.*;

public class DashboardPanel extends JPanel {

    public DashboardPanel(MainFrame frame) {
        setLayout(new BorderLayout());

        JLabel title = new JLabel("Dashboard", JLabel.CENTER);
        title.setFont(new Font("Arial", Font.BOLD, 24));

        JPanel buttonPanel = new JPanel();

        JButton settingsButton = new JButton("Settings");
        JButton logoutButton = new JButton("Logout");

        settingsButton.addActionListener(e -> {
            frame.showPage(MainFrame.SETTINGS);
        });

        logoutButton.addActionListener(e -> {
            frame.showPage(MainFrame.LOGIN);
        });

        buttonPanel.add(settingsButton);
        buttonPanel.add(logoutButton);

        add(title, BorderLayout.CENTER);
        add(buttonPanel, BorderLayout.SOUTH);
    }
}