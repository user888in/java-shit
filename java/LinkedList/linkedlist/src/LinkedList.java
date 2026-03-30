class ListNode {
    int value; // value
    ListNode next; // pointer to the next node

    ListNode(int value) {
        this.value = value;
        this.next = null;
    }
}
public class LinkedList{
    public static void main(String args[]) {
        ListNode head = new ListNode(12);
        head.next = new ListNode(34);
        head.next.next = new ListNode(77);
        while (head != null) {
            System.out.println(head.value);
            head = head.next;
        }
    }
}