import React, { useState, useEffect } from "react";
import { View, StyleSheet, FlatList, RefreshControl } from "react-native";
import {
  Text,
  Searchbar,
  Avatar,
  Card,
  Chip,
  ActivityIndicator,
  Divider,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "react-native-paper";
import { spacing, typography } from "../../constants/theme";
import { SquadMembersScreenProps } from "../../types/navigation";
import SquadService from "../../services/SquadService";
import { useAuth } from "../../contexts/AuthContext";
import { SquadMember } from "../../types/squad";

const SquadMembersScreen: React.FC<SquadMembersScreenProps> = ({ route }) => {
  const { squadId } = route.params;
  const theme = useTheme();
  const { accessToken } = useAuth();

  const [members, setMembers] = useState<SquadMember[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<SquadMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Initialize squad service with auth token
  useEffect(() => {
    SquadService.setAuthToken(accessToken);
    fetchMembers();
  }, [squadId, accessToken]);

  // Fetch squad members
  const fetchMembers = async () => {
    try {
      setLoading(true);
      // In a real implementation, this would fetch members from the API
      // For now, we'll simulate with mock data
      const mockMembers: SquadMember[] = [
        {
          id: "1",
          squad_id: squadId,
          user_id: "user1",
          user: {
            id: "user1",
            display_name: "Alex Johnson",
            avatar_url: "https://via.placeholder.com/40",
            total_points: 1250,
          },
          role: "admin",
          joined_at: new Date(Date.now() - 86400000 * 30).toISOString(),
          contribution_points: 450,
        },
        {
          id: "2",
          squad_id: squadId,
          user_id: "user2",
          user: {
            id: "user2",
            display_name: "Sam Wilson",
            avatar_url: "https://via.placeholder.com/40",
            total_points: 890,
          },
          role: "moderator",
          joined_at: new Date(Date.now() - 86400000 * 15).toISOString(),
          contribution_points: 320,
        },
        {
          id: "3",
          squad_id: squadId,
          user_id: "user3",
          user: {
            id: "user3",
            display_name: "Taylor Reed",
            avatar_url: "https://via.placeholder.com/40",
            total_points: 650,
          },
          role: "member",
          joined_at: new Date(Date.now() - 86400000 * 7).toISOString(),
          contribution_points: 180,
        },
        {
          id: "4",
          squad_id: squadId,
          user_id: "user4",
          user: {
            id: "user4",
            display_name: "Jordan Smith",
            avatar_url: "https://via.placeholder.com/40",
            total_points: 420,
          },
          role: "member",
          joined_at: new Date(Date.now() - 86400000 * 3).toISOString(),
          contribution_points: 95,
        },
      ];

      setMembers(mockMembers);
      setFilteredMembers(mockMembers);
    } catch (err: any) {
      setError(err.message || "Failed to load squad members");
    } finally {
      setLoading(false);
    }
  };

  // Refresh members
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMembers();
    setRefreshing(false);
  };

  // Filter members based on search query
  useEffect(() => {
    if (!searchQuery) {
      setFilteredMembers(members);
    } else {
      const filtered = members.filter((member) =>
        member.user?.display_name
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      );
      setFilteredMembers(filtered);
    }
  }, [searchQuery, members]);

  // Render member item
  const renderMemberItem = ({ item }: { item: SquadMember }) => (
    <Card style={styles.memberCard}>
      <Card.Content style={styles.memberCardContent}>
        <Avatar.Image
          size={48}
          source={{
            uri: item.user?.avatar_url || "https://via.placeholder.com/48",
          }}
        />

        <View style={styles.memberInfo}>
          <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
            {item.user?.display_name}
          </Text>

          <View style={styles.memberStats}>
            <Text
              variant="bodySmall"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              {item.user?.total_points} pts
            </Text>
            <Text
              variant="bodySmall"
              style={{
                color: theme.colors.onSurfaceVariant,
                marginLeft: spacing.sm,
              }}
            >
              {item.contribution_points} contrib
            </Text>
          </View>
        </View>

        <Chip
          mode="outlined"
          style={[
            styles.roleChip,
            item.role === "admin" && styles.adminChip,
            item.role === "moderator" && styles.moderatorChip,
          ]}
        >
          {item.role}
        </Chip>
      </Card.Content>
    </Card>
  );

  if (loading) {
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
            Loading members...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search members..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
      </View>

      <Divider />

      {/* Members List */}
      {filteredMembers.length > 0 ? (
        <FlatList
          data={filteredMembers}
          renderItem={renderMemberItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Avatar.Icon
            size={64}
            icon="account-group"
            style={{ backgroundColor: theme.colors.surface }}
          />
          <Text
            variant="headlineSmall"
            style={{
              color: theme.colors.onSurface,
              marginTop: spacing.lg,
              textAlign: "center",
            }}
          >
            No members found
          </Text>
          <Text
            variant="bodyMedium"
            style={{
              color: theme.colors.onSurfaceVariant,
              textAlign: "center",
              marginTop: spacing.sm,
            }}
          >
            Try adjusting your search
          </Text>
        </View>
      )}
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
  searchContainer: {
    padding: spacing.md,
  },
  searchBar: {
    marginBottom: spacing.sm,
  },
  listContainer: {
    padding: spacing.md,
    paddingTop: spacing.sm,
  },
  memberCard: {
    marginBottom: spacing.md,
  },
  memberCardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  memberInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  memberStats: {
    flexDirection: "row",
    marginTop: spacing.xs,
  },
  roleChip: {
    backgroundColor: "#e0e0e0",
  },
  adminChip: {
    backgroundColor: "#ffcdd2",
  },
  moderatorChip: {
    backgroundColor: "#bbdefb",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
});

export default SquadMembersScreen;
