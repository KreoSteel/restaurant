import { useRolePermissions } from './useRolePermissions';

export const useAdminPermission = () => {
  const { isAdmin, isLoading, error } = useRolePermissions();

  return {
    isAdmin,
    isLoading,
    error,
    canManageDishes: isAdmin,
    canManageIngredients: isAdmin,
  };
};
