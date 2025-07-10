import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { 
  Users, 
  UserPlus, 
  Trash2, 
  Shield, 
  DollarSign, 
  Package, 
  Truck,
  CheckCircle,
  AlertCircle,
  Search
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface User {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  isActive: boolean;
  department?: string;
}

interface DepartmentAssignment {
  id: number;
  adminUserId: number;
  department: string;
  isActive: boolean;
  assignedAt: string;
  user?: User;
}

const DEPARTMENTS = [
  { 
    key: 'financial', 
    name: 'واحد مالی', 
    icon: DollarSign, 
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  { 
    key: 'warehouse', 
    name: 'واحد انبار', 
    icon: Package, 
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  { 
    key: 'logistics', 
    name: 'واحد لجستیک', 
    icon: Truck, 
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200'
  }
];

export default function DepartmentUsers() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [assignments, setAssignments] = useState<DepartmentAssignment[]>([]);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchAssignments();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await apiRequest('/api/admin/users');
      setUsers(response.users || []);
    } catch (error) {
      toast({
        title: "خطا",
        description: "خطا در دریافت کاربران",
        variant: "destructive",
      });
    }
  };

  const fetchAssignments = async () => {
    try {
      const response = await apiRequest('/api/admin/department-assignments');
      setAssignments(response.assignments || []);
    } catch (error) {
      toast({
        title: "خطا", 
        description: "خطا در دریافت تخصیص‌های بخش",
        variant: "destructive",
      });
    }
  };

  const assignUserToDepartment = async () => {
    if (!selectedUser || !selectedDepartment) {
      toast({
        title: "خطا",
        description: "لطفاً کاربر و بخش را انتخاب کنید",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await apiRequest('/api/admin/department-assignments', {
        method: 'POST',
        body: {
          adminUserId: selectedUser,
          department: selectedDepartment
        }
      });

      toast({
        title: "موفقیت",
        description: "کاربر با موفقیت به بخش تخصیص داده شد",
        variant: "default",
      });

      fetchAssignments();
      setSelectedUser(null);
      setSelectedDepartment("");
    } catch (error) {
      toast({
        title: "خطا",
        description: "خطا در تخصیص کاربر به بخش",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const removeAssignment = async (assignmentId: number) => {
    setLoading(true);
    try {
      await apiRequest(`/api/admin/department-assignments/${assignmentId}`, {
        method: 'DELETE'
      });

      toast({
        title: "موفقیت",
        description: "تخصیص کاربر لغو شد",
        variant: "default",
      });

      fetchAssignments();
    } catch (error) {
      toast({
        title: "خطا",
        description: "خطا در لغو تخصیص",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.firstName && user.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.lastName && user.lastName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getAssignedUsers = (departmentKey: string) => {
    return assignments.filter(assignment => 
      assignment.department === departmentKey && assignment.isActive
    );
  };

  const isUserAssigned = (userId: number) => {
    return assignments.some(assignment => 
      assignment.adminUserId === userId && assignment.isActive
    );
  };

  const getUserName = (userId: number) => {
    const user = users.find(u => u.id === userId);
    return user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username : 'نامشخص';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">مدیریت کاربران بخش‌ها</h1>
              <p className="text-gray-600">تخصیص کاربران به بخش‌های مختلف</p>
            </div>
          </div>
        </div>

        {/* Add Assignment Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              تخصیص کاربر جدید
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>انتخاب کاربر</Label>
                <Select value={selectedUser?.toString() || ""} onValueChange={(value) => setSelectedUser(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue placeholder="کاربر را انتخاب کنید" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredUsers.filter(user => !isUserAssigned(user.id)).map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {getUserName(user.id)} ({user.username})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>انتخاب بخش</Label>
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger>
                    <SelectValue placeholder="بخش را انتخاب کنید" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map((dept) => (
                      <SelectItem key={dept.key} value={dept.key}>
                        <div className="flex items-center gap-2">
                          <dept.icon className={`w-4 h-4 ${dept.color}`} />
                          {dept.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button 
                  onClick={assignUserToDepartment} 
                  disabled={loading || !selectedUser || !selectedDepartment}
                  className="w-full"
                >
                  {loading ? "در حال تخصیص..." : "تخصیص کاربر"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="جستجو در کاربران..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Departments */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {DEPARTMENTS.map((department) => {
            const departmentUsers = getAssignedUsers(department.key);
            const Icon = department.icon;

            return (
              <Card key={department.key} className={`${department.borderColor} border-2`}>
                <CardHeader className={department.bgColor}>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-5 h-5 ${department.color}`} />
                      {department.name}
                    </div>
                    <Badge variant="secondary">
                      {departmentUsers.length} کاربر
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  {departmentUsers.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p>هیچ کاربری تخصیص داده نشده</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {departmentUsers.map((assignment) => (
                        <div key={assignment.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                              <Shield className="w-4 h-4 text-gray-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {getUserName(assignment.adminUserId)}
                              </p>
                              <p className="text-sm text-gray-500">
                                تخصیص: {new Date(assignment.assignedAt).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-green-600 border-green-200">
                              <CheckCircle className="w-3 h-3 ml-1" />
                              فعال
                            </Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => removeAssignment(assignment.id)}
                              disabled={loading}
                              className="text-red-600 border-red-200 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* All Users List */}
        <Card>
          <CardHeader>
            <CardTitle>همه کاربران</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredUsers.map((user) => {
                const isAssigned = isUserAssigned(user.id);
                const userAssignment = assignments.find(a => a.adminUserId === user.id && a.isActive);
                const department = userAssignment ? DEPARTMENTS.find(d => d.key === userAssignment.department) : null;

                return (
                  <div key={user.id} className="flex items-center justify-between p-4 bg-white rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <Shield className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {getUserName(user.id)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {user.username} • {user.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isAssigned && department ? (
                        <Badge className={`${department.color} ${department.bgColor}`}>
                          <department.icon className="w-3 h-3 ml-1" />
                          {department.name}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-gray-500">
                          تخصیص نداده
                        </Badge>
                      )}
                      <Badge variant={user.isActive ? "default" : "secondary"}>
                        {user.isActive ? "فعال" : "غیرفعال"}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}