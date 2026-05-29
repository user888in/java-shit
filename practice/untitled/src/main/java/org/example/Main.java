package org.example;


import java.util.Arrays;
import java.util.HashMap;
import java.util.Stack;

public class Main {
    // size: 26*4 = 104 - better in terms of constrained input
    public static char firstNonRepeatingUsingArray(String str) {
        int freq[] = new int[26];
        for (char s : str.toCharArray()) {
            freq[s - 'a']++;
        }
        System.out.println(Arrays.toString(freq));

        for (char c : str.toCharArray()) {
            if (freq[c - 'a'] == 1) {
                return c;
            }
        }
        return '_';
    }

    // size : few hundred bytes - flexible solutions
    public static char firstNonRepeatingUsingHashMap(String str) {
        HashMap<Character, Integer> map = new HashMap<>();
        for (char s : str.toCharArray()) {
            map.put(s, map.getOrDefault(s, 0) + 1);
        }
        System.out.println(map);
        for (char s : str.toCharArray()) {
            if (map.get(s) == 1) {
                return s;
            }
        }
        return '_';
    }

    public static int[] twoSum(int[] nums, int target) {
        HashMap<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            if (map.containsKey(target - nums[i])) {
                return new int[]{map.get(target - nums[i]), i};
            }
            map.put(nums[i], i);
        }
        return new int[]{-1, -1};
    }

    public static boolean isMatchingPair(char open, char close) {
        return (open == '(' && close == ')') || (open == '[' && close == ']') || (open == '{' && close == '}');
    }

    public static boolean isValid(String str) {
        Stack<Character> stack = new Stack<>();
        for (char c : str.toCharArray()) {
            if (c == '(' || c == '[' || c == '{') {
                stack.push(c);
            } else {
                if (stack.isEmpty()) return false;
                char top = stack.pop();
                if (!isMatchingPair(top, c)) return false;
            }
        }
        return stack.isEmpty();
    }

    public static boolean isPalindrome(String string) {
        String cleaned = string.replaceAll("[^a-zA-Z0-9]", "").toLowerCase();
        int first = 0;
        int last = cleaned.length() - 1;
        while (first < last) {
            if (cleaned.charAt(first) != cleaned.charAt(last)) {
                return false;
            }
            first++;
            last--;
        }
        return true;
    }

    public static boolean isPalindromeOptimizedVersion(String s) {
        int left = 0;
        int right = s.length() - 1;
        while (left < right) {
            while (left < right && !Character.isLetterOrDigit(s.charAt(left))) {
                left++;
            }
            while (left < right && !Character.isLetterOrDigit(s.charAt(right))) {
                right--;
            }
            if (Character.toLowerCase(s.charAt(left)) != Character.toLowerCase(s.charAt(right))) {
                return false;
            }
            left++;
            right--;
        }
        return true;
    }

    public static boolean isAnagram(String s, String t) {
        int[] freq = new int[26];
        for (char c : s.toCharArray()) {
            freq[c - 'a']++;
        }
        for (char c : t.toCharArray()) {
            freq[c - 'a']--;
        }
        for (int i : freq) {
            if (i != 0) {
                return false;
            }
        }
        return true;
    }

    public static int missingNumber(int[] nums) {
        int n = nums.length;
        int sum = n * (n + 1) / 2;
        int total = 0;
        for (int i : nums) {
            total += i;
        }
        return sum - total;
    }

    public static int missingNumberXor(int[] nums) {
        int xor = nums.length;
        for (int i = 0; i < nums.length; i++) {
            xor = xor ^ i ^ nums[i];
        }
        return xor;
    }

    public static void moveZeroes(int[] nums) {
        int insertPos = 0;
        for (int num : nums) {
            if (num != 0) {
                nums[insertPos] = num;
                insertPos++;
            }
        }
        while (insertPos < nums.length) {
            nums[insertPos] = 0;
            insertPos++;
        }
    }

    public static void main(String[] args) {
        System.out.println(firstNonRepeatingUsingArray("aabccda"));
        System.out.println(firstNonRepeatingUsingHashMap("allahhuakbar"));
        int[] numbers = {2, 7, 11, 12, 15};
        int[] result = twoSum(numbers, 27);
        System.out.println(Arrays.toString(result));
        System.out.println("Is valid String : " + isValid("()"));
        System.out.println("Is palindrome string : " + isPalindrome("A man, a plan, a canal: Panama"));
        System.out.println("is palindrome string : " + isPalindromeOptimizedVersion("bananab"));
        System.out.println("is anagram : " + isAnagram("listen", "silent"));
        System.out.println("Missing number : " + missingNumber(new int[]{9, 6, 4, 2, 3, 5, 7, 0, 1}));
        System.out.println("Missing number : " + missingNumberXor(new int[]{6, 4, 2, 3, 0, 1}));
        int[] nums = new int[]{0, 1, 0, 3, 12};
        moveZeroes(nums);
        System.out.println(Arrays.toString(nums));
    }
}