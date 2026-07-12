import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function AuditPage() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Product Audit</h1>
          <p className="text-muted-foreground">Independent assurance & control validation</p>
        </div>
        <Button>Generate Audit Report</Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Controls Tested</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">47</p>
            <p className="text-xs text-green-600">+12 this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Critical Findings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">3</p>
            <Badge variant="destructive">Requires Action</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Open Items</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">8</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">94%</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Audits Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Audit Activities</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Product / Module</TableHead>
                <TableHead>Finding</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Owner</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>2025-05-26</TableCell>
                <TableCell>Settlement Engine</TableCell>
                <TableCell>Reconciliation gap in partner bank</TableCell>
                <TableCell><Badge variant="destructive">High</Badge></TableCell>
                <TableCell>Finance Team</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>2025-05-25</TableCell>
                <TableCell>Wallet Service</TableCell>
                <TableCell>IAM over-privileged accounts</TableCell>
                <TableCell><Badge variant="secondary">Medium</Badge></TableCell>
                <TableCell>Security</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
