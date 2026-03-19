import client from './client';

export const auditsApi = {
  createAudit: async (data: any) => {
    const res = await client.post('/audits', data);
    return res.data;
  },
  listAudits: async () => {
    const res = await client.get('/audits');
    return res.data.audits || res.data;
  },
  getAudit: async (id: string) => {
    const res = await client.get(`/audits/${id}`);
    return res.data.audit || res.data;
  },
  downloadReport: async (id: string) => {
    const res = await client.get(`/audits/${id}/report`, { responseType: 'blob' });
    return res.data;
  }
};
