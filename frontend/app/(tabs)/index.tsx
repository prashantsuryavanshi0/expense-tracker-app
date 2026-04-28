import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { PieChart } from "react-native-chart-kit";

const API = "http://10.159.50.224:5000/api";
export default function Index() {
  const [token, setToken] = useState<string | null>(null);

  // auth
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // expense
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [expenses, setExpenses] = useState<any[]>([]);

  // edit
  const [editId, setEditId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editCategory, setEditCategory] = useState("");

  useEffect(() => {
    loadToken();
  }, []);

  const loadToken = async () => {
    const t = await AsyncStorage.getItem("token");
    if (t) {
      setToken(t);
      fetchExpenses(t);
    }
  };

  // ================= AUTH =================

  const register = async () => {
    await fetch(`${API}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    alert("Registered! Now login");
  };

  const login = async () => {
    const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (data.token) {
      await AsyncStorage.setItem("token", data.token);
      setToken(data.token);
      fetchExpenses(data.token);
    } else {
      alert("Login failed");
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem("token");
    setToken(null);
  };

  // ================= EXPENSE =================

  const fetchExpenses = async (tk = token) => {
    if (!tk) return;

    const res = await fetch(`${API}/expenses`, {
      headers: {
        Authorization: `Bearer ${tk}`,
      },
    });

    const data = await res.json();

    if (Array.isArray(data)) {
      setExpenses(data);
    } else {
      setExpenses([]);
    }
  };

  const addExpense = async () => {
    if (!amount || !category) return alert("Fill fields");

    await fetch(`${API}/expenses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        amount: Number(amount),
        category,
      }),
    });

    setAmount("");
    setCategory("");
    fetchExpenses();
  };

  const deleteExpense = async (id: string) => {
    await fetch(`${API}/expenses/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    fetchExpenses();
  };

  const startEdit = (item: any) => {
    setEditId(item._id);
    setEditAmount(item.amount.toString());
    setEditCategory(item.category);
  };

  const updateExpense = async (id: string) => {
    await fetch(`${API}/expenses/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        amount: Number(editAmount),
        category: editCategory,
      }),
    });

    setEditId(null);
    fetchExpenses();
  };

  // ================= CALC =================

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  const chartData = Object.values(
    expenses.reduce((acc: any, curr: any) => {
      if (!acc[curr.category]) {
        acc[curr.category] = {
          name: curr.category,
          amount: 0,
          color:
            "#" + Math.floor(Math.random() * 16777215).toString(16),
          legendFontColor: "#fff",
          legendFontSize: 12,
        };
      }
      acc[curr.category].amount += curr.amount;
      return acc;
    }, {})
  );

  // ================= UI =================

  if (!token) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Login / Register</Text>

        <TextInput
          placeholder="Email"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          placeholder="Password"
          style={styles.input}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <Button title="Login" onPress={login} />
        <View style={{ marginTop: 10 }}>
          <Button title="Register" onPress={register} />
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Expense Tracker</Text>

      <TextInput
        placeholder="Amount"
        style={styles.input}
        value={amount}
        onChangeText={setAmount}
      />
      <TextInput
        placeholder="Category"
        style={styles.input}
        value={category}
        onChangeText={setCategory}
      />

      <Button title="Add Expense" onPress={addExpense} />

      <Text style={styles.total}>Total: ₹{total}</Text>

      {chartData.length > 0 && (
        <PieChart
          data={chartData}
          width={350}
          height={220}
          accessor="amount"
          backgroundColor="transparent"
          paddingLeft="15"   // ✅ FIXED ERROR
          chartConfig={{
            color: () => "#fff",
          }}
        />
      )}

      {expenses.map((item) => (
        <View key={item._id} style={styles.item}>
          {editId === item._id ? (
            <>
              <TextInput
                value={editAmount}
                onChangeText={setEditAmount}
                style={styles.input}
              />
              <TextInput
                value={editCategory}
                onChangeText={setEditCategory}
                style={styles.input}
              />
              <Button title="Save" onPress={() => updateExpense(item._id)} />
            </>
          ) : (
            <>
              <Text style={styles.text}>
                ₹{item.amount} - {item.category}
              </Text>

              <View style={{ flexDirection: "row", gap: 10 }}>
                <Button title="Edit" onPress={() => startEdit(item)} />
                <Button
                  title="Delete"
                  color="red"
                  onPress={() => deleteExpense(item._id)}
                />
              </View>
            </>
          )}
        </View>
      ))}

      <Button title="Logout" color="red" onPress={logout} />
    </ScrollView>
  );
}

// ================= STYLE =================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#0b1f2a",
  },
  title: {
    fontSize: 24,
    color: "white",
    marginBottom: 20,
  },
  input: {
    backgroundColor: "#2c3e50",
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
    color: "white",
  },
  item: {
    backgroundColor: "#34495e",
    padding: 10,
    marginTop: 10,
    borderRadius: 5,
  },
  text: {
    color: "white",
    marginBottom: 5,
  },
  total: {
    color: "lightgreen",
    fontSize: 18,
    marginVertical: 10,
  },
});