'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ShieldCheck, RefreshCw, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function AdminRolesPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error(error);
        toast.error("Could not load users. Table might be empty.");
        setUsers([{
          id: "1",
          email: "ericopute@oeosolution.com",
          role: "admin"
        }]);
      } else {
        setUsers(data || []);
      }
    } catch (err) {
      toast.error("Connection error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
        <ShieldCheck className="text-emerald-600" /> Role Management
      </h1>
      <p className="text-slate-600 mb-8">Manage user permissions</p>

      <Card>
        <CardHeader>
          <CardTitle>Current Users ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <Badge variant="default">{u.role?.toUpperCase()}</Badge>
                  </TableCell>
                  <TableCell>
                    <Select defaultValue={u.role}>
                      <SelectTrigger className="w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="viewer">Viewer</SelectItem>
                        <SelectItem value="auditor">Auditor</SelectItem>
                        <SelectItem value="finance">Finance</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}