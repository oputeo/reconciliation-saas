'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ControlGateForm({ onSubmit, loading }: { onSubmit: (data: any) => void; loading: boolean }) {
  const [formData, setFormData] = useState({
    title: '',
    product_name: '',
    prd_url: '',
    description: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>New Product Control Review</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Review Title</Label>
            <Input required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
          </div>
          <div>
            <Label>Product Name</Label>
            <Input required value={formData.product_name} onChange={(e) => setFormData({ ...formData, product_name: e.target.value })} />
          </div>
          <div>
            <Label>PRD / Architecture Document URL</Label>
            <Input type="url" value={formData.prd_url} onChange={(e) => setFormData({ ...formData, prd_url: e.target.value })} />
          </div>
          <div>
            <Label>Description / Key Features</Label>
            <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={4} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Running AI Review...' : 'Submit for AI + Rules Review'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}