package org.example;

import java.util.HashMap;
import java.util.Map;
import java.util.Scanner;

public class MorseCode {
    private static final Map<Character, String> charToMorse = new HashMap<>();
    private static final Map<String, Character> morseToChar = new HashMap<>();

    static {
        String[][] morseTable = {
                {"A", ".-"}, {"B", "-..."}, {"C", "-.-."}, {"D", "-.."},
                {"E", "."}, {"F", "..-."}, {"G", "--."}, {"H", "...."},
                {"I", ".."}, {"J", ".---"}, {"K", "-.-"}, {"L", ".-.."},
                {"M", "--"}, {"N", "-."}, {"O", "---"}, {"P", ".--."},
                {"Q", "--.-"}, {"R", ".-."}, {"S", "..."}, {"T", "-"},
                {"U", "..-"}, {"V", "...-"}, {"W", ".--"}, {"X", "-..-"},
                {"Y", "-.--"}, {"Z", "--.."},
                {"0", "-----"}, {"1", ".----"}, {"2", "..---"}, {"3", "...--"},
                {"4", "....-"}, {"5", "....."}, {"6", "-...."}, {"7", "--..."},
                {"8", "---.."}, {"9", "----."},
                {" ", "/"}
        };
        for (String[] pair : morseTable) {
            char c = pair[0].charAt(0);
            String morse = pair[1];
            charToMorse.put(c, morse);
            morseToChar.put(morse, c);
        }

    }

    public static String encode(String text) {
        StringBuffer stringBuffer = new StringBuffer();
        text = text.toUpperCase();
        for (char c : text.toCharArray()) {
            String morse = charToMorse.get(c);
            if (morse != null) {
                if (!stringBuffer.isEmpty()) stringBuffer.append(" ");
                stringBuffer.append(morse);
            } else {
                System.out.println("unsupported character..." + c + " skipped");
            }
        }
        return stringBuffer.toString();
    }

    public static String decode(String morse) {
        StringBuffer stringBuffer = new StringBuffer();
        String[] words = morse.trim().split(" / | /|/ ");
        for (String word : words) {
            if (!stringBuffer.isEmpty()) stringBuffer.append(" ");
            String[] letters = word.trim().split(" ");
            for (String symbol : letters) {
                if (symbol.isEmpty()) continue;
                Character c = morseToChar.get(symbol);
                if (c != null && c != ' ') {
                    stringBuffer.append(c);
                } else {
                    System.out.println("unknown morse symbol : " + symbol + " skipped");
                }
            }
        }
        return stringBuffer.toString();
    }

    public static void main(String args[]) {

        Scanner sc = new Scanner(System.in);
        System.out.println("Enter choice : ");
        System.out.println("Encode : 1");
        System.out.println("Decode : 2");
        int choice = sc.nextInt();
        sc.nextLine();
        switch (choice) {
            case 1:
                System.out.println("Enter text to encode : ");
                String text = sc.nextLine();
                System.out.println(encode(text));
                break;
            case 2:
                System.out.println("Enter morse to decode : ");
                String morse = sc.nextLine();
                System.out.println(decode(morse));
                break;
            default:
                System.out.println("Wrong choice...");
        }
    }
}
