import { useQuery } from "@tanstack/react-query";
import { ReactNode } from "react";

interface RoleBasedAccessProps {
  moduleId: string;
  permission?: 'view' | 'create' | 'edit' | 'delete' | 'approve';
  children: ReactNode;
  fallback?: ReactNode;
}

export function RoleBasedAccess({ 
  moduleId, 
  permission = 'view', 
  children, 
  fallback = null 
}: RoleBasedAccessProps) {
  const { data: userPermissions } = useQuery({
    queryKey: ['/api/user/permissions'],
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });

  if (!userPermissions?.success) {
    return <>{fallback}</>;
  }

  const modulePermission = userPermissions.permissions?.find(
    (p: any) => p.moduleId === moduleId
  );

  if (!modulePermission) {
    return <>{fallback}</>;
  }

  // Check specific permission
  const hasPermission = (() => {
    switch (permission) {
      case 'view': return modulePermission.canView;
      case 'create': return modulePermission.canCreate;
      case 'edit': return modulePermission.canEdit;
      case 'delete': return modulePermission.canDelete;
      case 'approve': return modulePermission.canApprove;
      default: return false;
    }
  })();

  return hasPermission ? <>{children}</> : <>{fallback}</>;
}

// Hook for checking permissions
export function usePermissions() {
  const { data: userPermissions } = useQuery({
    queryKey: ['/api/user/permissions'],
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });

  const hasPermission = (moduleId: string, permission: 'view' | 'create' | 'edit' | 'delete' | 'approve' = 'view') => {
    if (!userPermissions?.success) return false;
    
    const modulePermission = userPermissions.permissions?.find(
      (p: any) => p.moduleId === moduleId
    );
    
    if (!modulePermission) return false;
    
    switch (permission) {
      case 'view': return modulePermission.canView;
      case 'create': return modulePermission.canCreate;
      case 'edit': return modulePermission.canEdit;
      case 'delete': return modulePermission.canDelete;
      case 'approve': return modulePermission.canApprove;
      default: return false;
    }
  };

  const getAllowedModules = () => {
    if (!userPermissions?.success) return [];
    return userPermissions.modules || [];
  };

  const getUserRoles = () => {
    if (!userPermissions?.success) return [];
    return userPermissions.roles || [];
  };

  return {
    hasPermission,
    getAllowedModules,
    getUserRoles,
    permissions: userPermissions?.permissions || [],
    isLoading: !userPermissions
  };
}