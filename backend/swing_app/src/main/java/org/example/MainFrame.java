package org.example;

import javax.swing.*;
import java.awt.*;

public class MainFrame extends JFrame {

    private CardLayout cardLayout;
    private JPanel mainPanel;

    public static final String LOGIN = "LOGIN";
    public static final String DASHBOARD = "DASHBOARD";
    public static final String SETTINGS = "SETTINGS";

    public MainFrame() {
        setTitle("Swing Navigation Example");
        setSize(500, 350);
        setLocationRelativeTo(null);
        setDefaultCloseOperation(EXIT_ON_CLOSE);

        cardLayout = new CardLayout();
        mainPanel = new JPanel(cardLayout);

        // Create panels
        mainPanel.add(new LoginPanel(this), LOGIN);
        mainPanel.add(new DashboardPanel(this), DASHBOARD);
        mainPanel.add(new SettingsPanel(this), SETTINGS);

        add(mainPanel);
        setVisible(true);
    }

    public void showPage(String page) {
        cardLayout.show(mainPanel, page);
    }
}