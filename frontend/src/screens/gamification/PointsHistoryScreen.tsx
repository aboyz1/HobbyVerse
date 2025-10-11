import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import {
  Text,
  Card,
  Chip,
  IconButton,
  ActivityIndicator,
  Divider,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "react-native-paper";
import { spacing, typography } from "../../constants/theme";
import { PointsHistoryScreenProps } from "../../types/navigation";
import { MaterialIcons } from "@expo/vector-icons";
import GamificationService from "../../services/GamificationService";

const PointsHistoryScreen: React.FC<PointsHistoryScreenProps> = ({
  navigation,
}) => {
  const theme = useTheme() as typeof import("../../constants/theme").theme;
  const [pointsHistory, setPointsHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<"all" | "earned" | "spent">("all");

  useEffect(() => {
    fetchPointsHistory();
  }, [filter]);

  const fetchPointsHistory = async () => {
    try {
      setLoading(true);
      // Since we don't have a real endpoint, we'll show a message
      setPointsHistory([]);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching points history:", err);
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPointsHistory();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  const getSourceIcon = (sourceType: string) => {
    switch (sourceType) {
      case "project":
        return "folder";
      case "squad_post":
        return "people";
      case "challenge":
        return "trophy";
      case "purchase":
        return "shopping-cart";
      case "post":
        return "edit";
      case "squad_join":
        return "group-add";
      case "comment":
        return "comment";
      default:
        return "help";
    }
  };

  const renderHistoryItem = ({ item }: { item: any }) => (
    <Card style={styles.historyCard}>
      <Card.Content style={styles.historyContent}>
        <View style={styles.iconContainer}>
          <MaterialIcons
            name={getSourceIcon(item.source_type) as any}
            size={24}
            color={item.points > 0 ? theme.colors.success : theme.colors.error}
          />
        </View>

        <View style={styles.historyInfo}>
          <Text
            variant="titleMedium"
            style={[styles.reason, { color: theme.colors.onBackground }]}
          >
            {item.reason}
          </Text>

          {item.squad_id && (
            <View style={styles.squadInfo}>
              <MaterialIcons
                name="people"
                size={16}
                color={theme.colors.onSurfaceVariant}
              />
              <Text
                variant="bodySmall"
                style={[
                  styles.squadText,
                  {
                    color: theme.colors.onSurfaceVariant,
                    marginLeft: spacing.xs,
                  },
                ]}
              >
                Squad Activity
              </Text>
            </View>
          )}

          <Text
            variant="bodySmall"
            style={[styles.date, { color: theme.colors.onSurfaceVariant }]}
          >
            {formatDate(
              item.date || item.created_at || new Date().toISOString()
            )}
          </Text>
        </View>

        <View style={styles.pointsContainer}>
          <Text
            variant="titleMedium"
            style={[
              styles.pointsText,
              {
                color:
                  item.points > 0 ? theme.colors.success : theme.colors.error,
              },
            ]}
          >
            {item.points > 0 ? `+${item.points}` : item.points || 0}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );

  const renderFilterChips = () => (
    <View style={styles.filterContainer}>
      <Chip
        mode="outlined"
        selected={filter === "all"}
        onPress={() => setFilter("all")}
        style={styles.filterChip}
      >
        All
      </Chip>
      <Chip
        mode="outlined"
        selected={filter === "earned"}
        onPress={() => setFilter("earned")}
        style={styles.filterChip}
      >
        Earned
      </Chip>
      <Chip
        mode="outlined"
        selected={filter === "spent"}
        onPress={() => setFilter("spent")}
        style={styles.filterChip}
      >
        Spent
      </Chip>
    </View>
  );

  if (loading && pointsHistory.length === 0) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text
            variant="bodyLarge"
            style={{
              marginTop: spacing.md,
              color: theme.colors.onSurfaceVariant,
            }}
          >
            Loading points history...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show a message when there's no points history endpoint
  if (pointsHistory.length === 0 && !loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <View style={styles.header}>
          <Text
            variant="headlineMedium"
            style={[styles.title, { color: theme.colors.onBackground }]}
          >
            Points History
          </Text>
          {renderFilterChips()}
        </View>

        <View style={styles.centered}>
          <MaterialIcons
            name="history"
            size={48}
            color={theme.colors.onSurfaceVariant}
          />
          <Text
            variant="bodyLarge"
            style={{
              marginTop: spacing.md,
              color: theme.colors.onSurfaceVariant,
              textAlign: "center",
              marginHorizontal: spacing.lg,
            }}
          >
            Points history tracking is not yet available. This feature is coming
            soon!
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.header}>
        <Text
          variant="headlineMedium"
          style={[styles.title, { color: theme.colors.onBackground }]}
        >
          Points History
        </Text>
        {renderFilterChips()}
      </View>

      <FlatList
        data={pointsHistory}
        renderItem={renderHistoryItem}
        keyExtractor={(item) => item.id || Math.random().toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <Card style={styles.infoCard}>
            <Card.Content>
              <View style={styles.infoRow}>
                <MaterialIcons
                  name="info"
                  size={20}
                  color={theme.colors.primary}
                />
                <Text
                  variant="bodyMedium"
                  style={{
                    color: theme.colors.onSurface,
                    marginLeft: spacing.sm,
                  }}
                >
                  Track all your points earnings and expenditures. Points can be
                  earned through activities and spent on premium features.
                </Text>
              </View>
            </Card.Content>
          </Card>
        }
        ItemSeparatorComponent={() => <Divider style={styles.divider} />}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    padding: spacing.lg,
    backgroundColor: "#f8f8f8",
  },
  title: {
    ...typography.h3,
    marginBottom: spacing.md,
  },
  filterContainer: {
    flexDirection: "row",
    justifyContent: "center",
  },
  filterChip: {
    marginHorizontal: spacing.sm,
  },
  listContainer: {
    padding: spacing.md,
  },
  infoCard: {
    marginBottom: spacing.lg,
    backgroundColor: "#e3f2fd",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  historyCard: {
    marginBottom: spacing.md,
  },
  historyContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    marginRight: spacing.lg,
  },
  historyInfo: {
    flex: 1,
  },
  reason: {
    ...typography.h6,
    marginBottom: spacing.xs,
  },
  squadInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  squadText: {
    ...typography.caption,
  },
  date: {
    ...typography.caption,
  },
  pointsContainer: {
    alignItems: "flex-end",
  },
  pointsText: {
    ...typography.h6,
  },
  divider: {
    marginVertical: spacing.sm,
  },
});

export default PointsHistoryScreen;
