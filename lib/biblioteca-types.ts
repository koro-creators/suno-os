export interface BibliotecaDocument {
  id: string;
  title: string;
  content: string;
  tags: string[];
  scope: string[];
  links: { label: string; url: string }[];
  files: { name: string; type: string; size: string }[];
  createdBy: string;
  updatedAt: string;
}
