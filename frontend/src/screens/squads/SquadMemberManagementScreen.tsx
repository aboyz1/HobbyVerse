import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
} from "react-native";
import {
  Text,
  Searchbar,
  Avatar,
  Card,
  Chip,
  ActivityIndicator,
  Button,
  Divider,
  Menu,
  IconButton,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "react-native-paper";
import { spacing, typography } from "../../constants/theme";
import { SquadMemberManagementScreenProps } from "../../types/navigation";
import SquadService from "../../services/SquadService";
import { useAuth } from "../../contexts/AuthContext";
import { SquadMember } from "../../types/squad";

const SquadMemberManagementScreen: React.FC<
  SquadMemberManagementScreenProps
> = ({ route }) => {
  const { squadId } = route.params;
  const theme = useTheme();
  const { accessToken, user: currentUser } = useAuth();

  const [members, setMembers] = useState<SquadMember[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<SquadMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [menuVisible, setMenuVisible] = useState<{ [key: string]: boolean }>(
    {}
  );

  // Initialize squad service with auth token
  useEffect(() => {
    SquadService.setAuthToken(accessToken);
    fetchMembers();
  }, [squadId, accessToken]);

  // Fetch squad members
  const fetchMembers = async () => {
    try {
      setLoading(true);
      const response = await SquadService.getSquadMembers(squadId);
      if (response.success) {
        setMembers(response.data || []);
        setFilteredMembers(response.data || []);
      } else {
        setError(response.error || "Failed to load squad members");
      }
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

  // Open/close menu for a member
  const openMenu = (userId: string) => {
    setMenuVisible((prev) => ({ ...prev, [userId]: true }));
  };

  const closeMenu = (userId: string) => {
    setMenuVisible((prev) => ({ ...prev, [userId]: false }));
  };

  // Promote member to moderator
  const handlePromoteMember = async (userId: string, displayName: string) => {
    try {
      const response = await SquadService.promoteMember(squadId, userId);
      if (response.success) {
        // Update the member's role in the list
        setMembers((prev) =>
          prev.map((member) =>
            member.user_id === userId
              ? { ...member, role: "moderator" }
              : member
          )
        );
        setFilteredMembers((prev) =>
          prev.map((member) =>
            member.user_id === userId
              ? { ...member, role: "moderator" }
              : member
          )
        );
        Alert.alert("Success", `${displayName} has been promoted to moderator`);
      } else {
        Alert.alert("Error", response.error || "Failed to promote member");
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to promote member");
    }
    closeMenu(userId);
  };

  // Demote member from moderator
  const handleDemoteMember = async (userId: string, displayName: string) => {
    try {
      const response = await SquadService.demoteMember(squadId, userId);
      if (response.success) {
        // Update the member's role in the list
        setMembers((prev) =>
          prev.map((member) =>
            member.user_id === userId ? { ...member, role: "member" } : member
          )
        );
        setFilteredMembers((prev) =>
          prev.map((member) =>
            member.user_id === userId ? { ...member, role: "member" } : member
          )
        );
        Alert.alert("Success", `${displayName} has been demoted to member`);
      } else {
        Alert.alert("Error", response.error || "Failed to demote member");
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to demote member");
    }
    closeMenu(userId);
  };

  // Remove member from squad
  const handleRemoveMember = async (userId: string, displayName: string) => {
    Alert.alert(
      "Remove Member",
      `Are you sure you want to remove ${displayName} from the squad?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await SquadService.removeMember(squadId, userId);
              if (response.success) {
                // Remove the member from the list
                setMembers((prev) =>
                  prev.filter((member) => member.user_id !== userId)
                );
                setFilteredMembers((prev) =>
                  prev.filter((member) => member.user_id !== userId)
                );
                Alert.alert(
                  "Success",
                  `${displayName} has been removed from the squad`
                );
              } else {
                Alert.alert(
                  "Error",
                  response.error || "Failed to remove member"
                );
              }
            } catch (err: any) {
              Alert.alert("Error", err.message || "Failed to remove member");
            }
          },
        },
      ]
    );
    closeMenu(userId);
  };

  // Render member item
  const renderMemberItem = ({ item }: { item: SquadMember }) => {
    // Find the current user's role in the squad
    const currentUserMember = members.find(
      (member) => member.user_id === currentUser?.id
    );
    const currentUserRole = currentUserMember?.role;

    // Don't show actions for the current user or admins
    const canManageMember =
      item.user_id !== currentUser?.id &&
      item.role !== "admin" &&
      (currentUserRole === "admin" || currentUserRole === "moderator");

    return (
      <Card style={styles.memberCard}>
        <Card.Content style={styles.memberCardContent}>
          <Avatar.Image
            size={48}
            source={{
              uri: item.user?.avatar_url || "https://via.placeholder.com/48",
            }}
          />

          <View style={styles.memberInfo}>
            <Text
              variant="titleMedium"
              style={{ color: theme.colors.onSurface }}
            >
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

          {canManageMember && (
            <Menu
              visible={menuVisible[item.user_id] || false}
              onDismiss={() => closeMenu(item.user_id)}
              anchor={
                <IconButton
                  icon="dots-vertical"
                  onPress={() => openMenu(item.user_id)}
                />
              }
            >
              {item.role === "member" && (
                <Menu.Item
                  onPress={() =>
                    handlePromoteMember(
                      item.user_id,
                      item.user?.display_name || "User"
                    )
                  }
                  title="Promote to Moderator"
                  leadingIcon="arrow-up"
                />
              )}
              {item.role === "moderator" && (
                <Menu.Item
                  onPress={() =>
                    handleDemoteMember(
                      item.user_id,
                      item.user?.display_name || "User"
                    )
                  }
                  title="Demote to Member"
                  leadingIcon="arrow-down"
                />
              )}
              <Menu.Item
                onPress={() =>
                  handleRemoveMember(
                    item.user_id,
                    item.user?.display_name || "User"
                  )
                }
                title="Remove from Squad"
                leadingIcon="account-remove"
              />
            </Menu>
          )}
        </Card.Content>
      </Card>
    );
  };

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
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Text variant="titleMedium" style={styles.listHeaderText}>
                {filteredMembers.length} Member
                {filteredMembers.length === 1 ? "" : "s"}
              </Text>
            </View>
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
  listHeader: {
    marginBottom: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  listHeaderText: {
    ...typography.h6,
    color: "#000000", // Will be overridden by theme
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

export default SquadMemberManagementScreen;
