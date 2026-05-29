
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.locks.ReentrantLock;

public class Cache<K, V> {
    private final int capacity;
    private final ConcurrentHashMap<K, Node<K, V>> map;
    private final ReentrantLock lock = new ReentrantLock();

    private Node<K, V> head;
    private Node<K, V> tail;

    public Cache(int capacity) {
        this.capacity = capacity;
        this.map = new ConcurrentHashMap<>();
    }

    private static class Node<K, V> {
        K key;
        V value;
        long expiryTime;
        Node<K, V> prev;
        Node<K, V> next;

        Node(K key, V value, long expiryTime) {
            this.key = key;
            this.value = value;
            this.expiryTime = expiryTime;
        }
    }

    public void put(K key, V value, long ttlInMillis) {
        long expiryTime = System.currentTimeMillis() + ttlInMillis;
        lock.lock();
        try {
            Node<K, V> existing = map.get(key);
            if (existing != null) {
                existing.value = value;
                existing.expiryTime = expiryTime;
                moveToHead(existing);
                return;
            }
            removeExpiredEntries();
            if (map.size() >= capacity) {
                evictLRU();
            }
            Node<K, V> newNode = new Node<>(key, value, expiryTime);
            addToHead(newNode);
            map.put(key, newNode);

        } catch (Exception e) {
            System.out.println(e);
        } finally {
            lock.unlock();
        }
    }

    public V get(K key) {
        Node<K, V> node = map.get(key);
        if (node == null) {
            return null;
        }
        lock.lock();
        try {
            if (isExpired(node)) {
                removeNode(node);
                map.remove(key);
                return null;
            }
            moveToHead(node);
            return node.value;

        } finally {
            lock.unlock();
        }
    }

    private boolean isExpired(Node<K, V> node) {
        return System.currentTimeMillis() > node.expiryTime;
    }

    private void removeExpiredEntries() {

        Node<K, V> current = tail;

        while (current != null) {

            Node<K, V> prev = current.prev;

            if (isExpired(current)) {
                removeNode(current);
                map.remove(current.key);
            }

            current = prev;
        }
    }

    private void evictLRU() {

        while (tail != null && isExpired(tail)) {
            Node<K, V> expired = tail;

            removeNode(expired);
            map.remove(expired.key);
        }

        if (tail != null) {
            Node<K, V> lru = tail;

            removeNode(lru);
            map.remove(lru.key);
        }
    }

    private void moveToHead(Node<K, V> node) {

        if (node == head) {
            return;
        }

        removeNode(node);
        addToHead(node);
    }

    private void addToHead(Node<K, V> node) {

        node.prev = null;
        node.next = head;

        if (head != null) {
            head.prev = node;
        }

        head = node;

        if (tail == null) {
            tail = node;
        }
    }

    private void removeNode(Node<K, V> node) {

        if (node.prev != null) {
            node.prev.next = node.next;
        } else {
            head = node.next;
        }

        if (node.next != null) {
            node.next.prev = node.prev;
        } else {
            tail = node.prev;
        }

        node.prev = null;
        node.next = null;
    }

    public int size() {
        return map.size();
    }

    public static void main(String[] args) throws Exception {

        Cache<String, String> cache = new Cache<>(2);

        cache.put("A", "apple", 5000);
        cache.put("B", "banana", 5000);

        System.out.println(cache.get("A"));

        cache.put("C", "cherry", 5000);

        System.out.println(cache.get("B"));

        Thread.sleep(6000);

        System.out.println(cache.get("A"));
    }

}
