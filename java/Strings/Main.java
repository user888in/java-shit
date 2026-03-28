
import java.util.HashMap;
import java.util.Map;

public class Main {

    public static String reverse(String str) {
        String result = "";
        for (int i = str.length() - 1; i >= 0; i--) {
            result += str.charAt(i);
        }
        return result;
    }

    public static boolean isPalindrome(String str) {
        int left = 0;
        int right = str.length() - 1;
        while (left < right) {
            if (str.charAt(left) != str.charAt(right)) {
                return false;
            }
            left++;
            right--;
        }
        return true;
    }

    public static Map<Integer,Character> maxOccuring(String str){
        Map<Integer, Character> map = new HashMap<>();
        int[] freq = new int[26];
        for(char c : str.toCharArray()){
            freq[c-'a']++;
        }
        int maxCount = 0;
        char result = ' ';
        for (int i = 0; i < 26; i++) {
            if(freq[i] > maxCount){
                maxCount = freq[i];
                result = (char)(i+'a');
            }
        }
        map.put(maxCount,result);
        return map;
    }

    public static void main(String[] args) {
        System.out.println("Running");
        String name = "Araj Ansari";

        System.out.println(name.length());
        System.out.println(name.charAt(0));
        System.out.println(name.charAt(3));
        System.out.println(name.substring(5));
        System.out.println(name.substring(0, 4));
        System.out.println(name.toUpperCase());
        System.out.println(name.toLowerCase());
        System.out.println(name.contains("raj"));
        System.out.println(name.replace("Ansari", "Lodu"));
        String[] words = name.split(" ");
        System.out.println(java.util.Arrays.toString(words));

        // slow -> creates a new each time
        String result = "";
        for (int i = 0; i < 5; i++) {
            result += i; // creates a new object everytime
        }
        System.out.println(result);
        // fast (modifies in place)
        StringBuilder sb = new StringBuilder();
        for (int i = 1; i <= 5; i++) {
            sb.append(i);
        }
        System.out.println(sb);

        // reverse a string
        String reversed = reverse("Bhagtuuu");
        System.out.println(reversed);
        System.out.println(isPalindrome("palap"));

        int arr[] = { 1, 2, 3, 4, 4, 60, 67, 90 };

        Map<Integer, Character> rs = maxOccuring("aabbcddddeeeehhhhss");
        System.out.println(rs);
    }
}
