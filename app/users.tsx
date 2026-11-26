import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

export default function Users() {
    const [users, setUsers] = useState<any[]>([]);

    useEffect(() => {
        fetch('https://jsonplaceholder.typicode.com/users')
            .then((res) => res.json())
            .then((data) => setUsers(data));
    }, []);

    return (
        <View style={{ padding: 20 }}>
            {users.map((u) => (
                <Text key={u.id}>{u.name} - {u.email}</Text>
            ))}
        </View>
    );
}