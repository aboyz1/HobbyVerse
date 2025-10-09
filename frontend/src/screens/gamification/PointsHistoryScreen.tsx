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

const PointsHistoryScreen: React.FC<PointsHistoryScreenProps> = ({
  navigation,
}) => {
  const theme = useTheme() as typeof import("../../constants/theme").theme;
  const [pointsHistory, setPointsHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<"all" | "earned" | "spent">("all");

  // Mock points history data
  const mockPointsHistory = [
    {
      id: "1",
      points: 50,
      reason: "Project created",
      source_type: "project",
      source_id: "proj1",
      date: "2023-07-15T10:30:00Z",
      squad_id: null,
    },
    {
      id: "2",
      points: 15,
      reason: "Squad post created",
      source_type: "squad_post",
      source_id: "post1",
      date: "2023-07-14T14:20:00Z",
      squad_id: "squad1",
    },
    {
      id: "3",
      points: 100,
      reason: "Challenge completed",
      source_type: "challenge",
      source_id: "chal1",
      date: "2023-07-12T09:15:00Z",
      squad_id: null,
    },
    {
      id: "4",
      points: -25,
      reason: "Premium feature purchase",
      source_type: "purchase",
      source_id: "feat1",
      date: "2023-07-10T16:45:00Z",
      squad_id: null,
    },
    {
      id: "5",
      points: 10,
      reason: "Post marked as helpful",
      source_type: "post",
      source_id: "post2",
      date: "2023-07-08T11:30:00Z",
      squad_id: null,
    },
    {
      id: "6",
      points: 20,
      reason: "Squad joined",
      source_type: "squad_join",
      source_id: "squad1",
      date: "2023-07-05T13:20:00Z",
      squad_id: "squad1",
    },
    {
      id: "7",
      points: 5,
      reason: "Comment created",
      source_type: "comment",
      source_id: "comm1",
      date: "2023-07-03T09:45:00Z",
      squad_id: null,
    },
  ];

  useEffect(() => {
    fetchPointsHistory();
  }, [filter]);

  const fetchPointsHistory = async () => {
    try {
      setLoading(true);
      // Simulate API call with mock data
      setTimeout(() => {
        let filteredHistory = mockPointsHistory;

        if (filter === "earned") {
          filteredHistory = mockPointsHistory.filter(
            (entry) => entry.points > 0
          );
        } else if (filter === "spent") {
          filteredHistory = mockPointsHistory.filter(
            (entry) => entry.points < 0
          );
        }

        // Sort by date descending
        filteredHistory.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        setPointsHistory(filteredHistory);
        setLoading(false);
      }, 1000);
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
            {formatDate(item.date)}
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
            {item.points > 0 ? `+${item.points}` : item.points}
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
        keyExtractor={(item) => item.id}
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
