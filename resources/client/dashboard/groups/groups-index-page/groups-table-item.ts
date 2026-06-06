export interface GroupsTableItem {
  id: number;
  name: string;
  default: boolean;
  users: {
    id: number;
    name: string;
    image: string;
  }[];
}
