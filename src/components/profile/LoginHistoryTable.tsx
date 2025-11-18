import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { History, CheckCircle, XCircle } from 'lucide-react';
import { fetchUserLoginHistory, LoginHistory } from '@/services/userManagementService';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

interface LoginHistoryTableProps {
  userId: string;
}

const LoginHistoryTable: React.FC<LoginHistoryTableProps> = ({ userId }) => {
  const [loginHistory, setLoginHistory] = useState<LoginHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const data = await fetchUserLoginHistory(userId, 10);
        setLoginHistory(data);
      } catch (error) {
        console.error('Error loading login history:', error);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [userId]);

  const maskIP = (ip: string) => {
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.***:***`;
    }
    return ip;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="w-5 h-5" />
          Recent Login Activity
        </CardTitle>
        <CardDescription>Your last 10 sign-in attempts</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : loginHistory.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No login history available</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loginHistory.map((login, index) => (
                  <TableRow key={index}>
                    <TableCell className="text-sm">
                      {format(new Date(login.timestamp), 'MMM d, yyyy HH:mm:ss')}
                    </TableCell>
                    <TableCell className="text-sm font-mono">
                      {maskIP(login.ip_address)}
                    </TableCell>
                    <TableCell>
                      {login.status === 'Success' ? (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Success
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="gap-1">
                          <XCircle className="w-3 h-3" />
                          Failed
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LoginHistoryTable;
