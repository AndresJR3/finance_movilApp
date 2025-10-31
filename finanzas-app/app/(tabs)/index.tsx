// app/(tabs)/index.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import type { Transaction, TransactionType } from '@/types';

export default function HomeScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string>('');

  useEffect(() => {
    loadUserData();
    loadTransactions();
    
    // Suscribirse a cambios en tiempo real
    const subscription = supabase
      .channel('transactions_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'transactions',
        },
        (payload) => {
          console.log('Cambio detectado:', payload);
          loadTransactions();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserEmail(user.email || '');
    }
  };

  const loadTransactions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error cargando:', error);
        Alert.alert('Error', 'No se pudieron cargar las transacciones');
      } else {
        setTransactions(data || []);
      }
    } catch (error) {
      console.error('Error de conexión:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  const addTransaction = async () => {
    if (!description.trim() || !amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Por favor completa todos los campos correctamente');
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const newTransaction = {
        description: description.trim(),
        amount: parseFloat(amount),
        type,
        date: new Date().toISOString(),
        user_id: user.id,
      };

      const { data, error } = await supabase
        .from('transactions')
        .insert([newTransaction])
        .select();

      if (error) {
        console.error('Error insertando:', error);
        Alert.alert('Error', 'No se pudo guardar la transacción');
      } else {
        setTransactions([data[0], ...transactions]);
        setDescription('');
        setAmount('');
        Alert.alert('¡Éxito!', 'Transacción guardada');
      }
    } catch (error) {
      console.error('Error de red:', error);
      Alert.alert('Error de Conexión', 'Verifica tu internet');
    } finally {
      setLoading(false);
    }
  };

  const deleteTransaction = async (id: string) => {
    Alert.alert(
      'Confirmar',
      '¿Estás seguro de eliminar esta transacción?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) return;

              const { error } = await supabase
                .from('transactions')
                .delete()
                .eq('id', id)
                .eq('user_id', user.id);

              if (error) {
                console.error('Error eliminando:', error);
                Alert.alert('Error', 'No se pudo eliminar');
              } else {
                setTransactions(transactions.filter((t) => t.id !== id));
              }
            } catch (error) {
              console.error('Error de red:', error);
              Alert.alert('Error', 'Verifica tu conexión');
            }
          },
        },
      ]
    );
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres salir?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Salir',
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut();
            // La redirección automática la maneja _layout.tsx
          },
        },
      ]
    );
  };

  const calculateBalance = (): number => {
    return transactions.reduce((acc, t) => {
      return t.type === 'income' ? acc + Number(t.amount) : acc - Number(t.amount);
    }, 0);
  };

  const balance = calculateBalance();
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  if (initialLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={styles.loadingText}>Cargando transacciones...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView style={styles.scrollView}>
        {/* Header con info de usuario */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerTitleContainer}>
              <Ionicons name="cash-outline" size={40} color="#10b981" />
              <Text style={styles.headerTitle}>FinanzasApp</Text>
            </View>
            <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
              <Ionicons name="log-out-outline" size={24} color="#ef4444" />
            </TouchableOpacity>
          </View>
          <Text style={styles.headerSubtitle}>{userEmail}</Text>
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Sincronizado en tiempo real</Text>
          </View>
        </View>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Balance Total</Text>
          <Text style={styles.balanceAmount}>${balance.toFixed(2)}</Text>
          <View style={styles.summaryContainer}>
            <View style={styles.summaryBox}>
              <View style={styles.summaryHeader}>
                <Ionicons name="trending-up" size={16} color="#d1fae5" />
                <Text style={styles.summaryLabel}>Ingresos</Text>
              </View>
              <Text style={styles.summaryAmount}>${totalIncome.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryBox}>
              <View style={styles.summaryHeader}>
                <Ionicons name="trending-down" size={16} color="#d1fae5" />
                <Text style={styles.summaryLabel}>Gastos</Text>
              </View>
              <Text style={styles.summaryAmount}>${totalExpense.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Formulario */}
        <View style={styles.formCard}>
          <View style={styles.formHeader}>
            <Ionicons name="add-circle-outline" size={24} color="#10b981" />
            <Text style={styles.formTitle}>Nueva Transacción</Text>
          </View>

          <View style={styles.typeButtonsContainer}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                type === 'expense' && styles.typeButtonExpenseActive,
              ]}
              onPress={() => setType('expense')}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  type === 'expense' && styles.typeButtonTextActive,
                ]}
              >
                Gasto
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeButton,
                type === 'income' && styles.typeButtonIncomeActive,
              ]}
              onPress={() => setType('income')}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  type === 'income' && styles.typeButtonTextActive,
                ]}
              >
                Ingreso
              </Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Descripción (ej: Supermercado)"
            placeholderTextColor="#9ca3af"
            value={description}
            onChangeText={setDescription}
          />
          <TextInput
            style={styles.input}
            placeholder="Monto"
            placeholderTextColor="#9ca3af"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
          />

          <TouchableOpacity
            style={[styles.addButton, loading && styles.addButtonDisabled]}
            onPress={addTransaction}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="cloud-upload-outline" size={24} color="#fff" />
                <Text style={styles.addButtonText}>Guardar</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Lista de transacciones */}
        <View style={styles.listCard}>
          <Text style={styles.listTitle}>
            Historial ({transactions.length})
          </Text>

          {transactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="wallet-outline" size={64} color="#4b5563" />
              <Text style={styles.emptyStateText}>No hay transacciones</Text>
              <Text style={styles.emptyStateSubtext}>
                Añade tu primera transacción arriba
              </Text>
            </View>
          ) : (
            transactions.map((transaction) => (
              <View key={transaction.id} style={styles.transactionItem}>
                <View style={styles.transactionLeft}>
                  <View
                    style={[
                      styles.transactionIcon,
                      transaction.type === 'income'
                        ? styles.transactionIconIncome
                        : styles.transactionIconExpense,
                    ]}
                  >
                    <Ionicons
                      name={
                        transaction.type === 'income'
                          ? 'trending-up'
                          : 'trending-down'
                      }
                      size={24}
                      color={transaction.type === 'income' ? '#10b981' : '#ef4444'}
                    />
                  </View>
                  <View style={styles.transactionInfo}>
                    <Text style={styles.transactionDescription}>
                      {transaction.description}
                    </Text>
                    <Text style={styles.transactionDate}>
                      {new Date(transaction.date).toLocaleDateString('es-MX', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Text>
                  </View>
                </View>
                <View style={styles.transactionRight}>
                  <Text
                    style={[
                      styles.transactionAmount,
                      transaction.type === 'income'
                        ? styles.transactionAmountIncome
                        : styles.transactionAmountExpense,
                    ]}
                  >
                    {transaction.type === 'income' ? '+' : '-'}$
                    {Number(transaction.amount).toFixed(2)}
                  </Text>
                  <TouchableOpacity
                    onPress={() => deleteTransaction(transaction.id)}
                    style={styles.deleteButton}
                  >
                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.footer}>
          <Ionicons name="shield-checkmark-outline" size={20} color="#10b981" />
          <Text style={styles.footerText}>Datos protegidos con RLS</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827' },
  scrollView: { flex: 1 },
  loadingContainer: { flex: 1, backgroundColor: '#111827', justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#9ca3af', marginTop: 12, fontSize: 16 },
  header: { paddingTop: 60, paddingBottom: 24, paddingHorizontal: 16 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  headerTitleContainer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#10b981' },
  signOutButton: { padding: 8 },
  headerSubtitle: { color: '#9ca3af', fontSize: 14, marginBottom: 8 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#1f2937', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, alignSelf: 'flex-start' },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10b981' },
  statusText: { color: '#9ca3af', fontSize: 12 },
  balanceCard: { backgroundColor: '#10b981', marginHorizontal: 16, marginBottom: 16, padding: 24, borderRadius: 20 },
  balanceLabel: { color: '#d1fae5', fontSize: 14, marginBottom: 8 },
  balanceAmount: { color: '#fff', fontSize: 48, fontWeight: 'bold', marginBottom: 16 },
  summaryContainer: { flexDirection: 'row', gap: 12 },
  summaryBox: { flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.1)', padding: 12, borderRadius: 12 },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  summaryLabel: { color: '#d1fae5', fontSize: 12 },
  summaryAmount: { color: '#fff', fontSize: 20, fontWeight: '600' },
  formCard: { backgroundColor: '#1f2937', marginHorizontal: 16, marginBottom: 16, padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#374151' },
  formHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  formTitle: { color: '#fff', fontSize: 20, fontWeight: '600' },
  typeButtonsContainer: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  typeButton: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#374151', alignItems: 'center' },
  typeButtonExpenseActive: { backgroundColor: '#ef4444' },
  typeButtonIncomeActive: { backgroundColor: '#10b981' },
  typeButtonText: { color: '#9ca3af', fontSize: 16, fontWeight: '600' },
  typeButtonTextActive: { color: '#fff' },
  input: { backgroundColor: '#374151', borderWidth: 1, borderColor: '#4b5563', borderRadius: 12, padding: 16, color: '#fff', fontSize: 16, marginBottom: 12 },
  addButton: { backgroundColor: '#10b981', borderRadius: 12, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  addButtonDisabled: { opacity: 0.5 },
  addButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  listCard: { backgroundColor: '#1f2937', marginHorizontal: 16, marginBottom: 16, padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#374151' },
  listTitle: { color: '#fff', fontSize: 20, fontWeight: '600', marginBottom: 16 },
  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyStateText: { color: '#9ca3af', fontSize: 16, marginTop: 16 },
  emptyStateSubtext: { color: '#6b7280', fontSize: 14, marginTop: 4 },
  transactionItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#374151', padding: 16, borderRadius: 12, marginBottom: 12 },
  transactionLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  transactionIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  transactionIconIncome: { backgroundColor: 'rgba(16, 185, 129, 0.2)' },
  transactionIconExpense: { backgroundColor: 'rgba(239, 68, 68, 0.2)' },
  transactionInfo: { flex: 1 },
  transactionDescription: { color: '#fff', fontSize: 16, fontWeight: '500', marginBottom: 4 },
  transactionDate: { color: '#9ca3af', fontSize: 12 },
  transactionRight: { alignItems: 'flex-end', gap: 8 },
  transactionAmount: { fontSize: 18, fontWeight: 'bold' },
  transactionAmountIncome: { color: '#10b981' },
  transactionAmountExpense: { color: '#ef4444' },
  deleteButton: { padding: 4 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 24 },
  footerText: { color: '#10b981', fontSize: 12 },
});