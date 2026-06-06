import {ChatPasteGoIcon} from '@ui/icons/chat-paste-go';
import {ChartNoAxesCombinedIcon} from '@ui/icons/lucide/chart-no-axes-combined';
import {ChatbotIcon} from '@ui/icons/lucide/chatbot-icon';
import {LibraryIcon} from '@ui/icons/lucide/library-icon';
import {MessagesSquareIcon} from '@ui/icons/lucide/messages-square-icon';
import {MousePointerClickIcon} from '@ui/icons/lucide/mouse-pointer-click';
import {AccountCircleIcon} from '@ui/icons/material/AccountCircle';
import {BookmarkBorderIcon} from '@ui/icons/material/BookmarkBorder';
import {DashboardIcon as DashboardIconMaterial} from '@ui/icons/material/Dashboard';
import {DeleteIcon} from '@ui/icons/material/Delete';
import {FavoriteBorderIcon} from '@ui/icons/material/FavoriteBorder';
import {FlagIcon} from '@ui/icons/material/Flag';
import {GroupIcon} from '@ui/icons/material/Group';
import {HomeIcon} from '@ui/icons/material/Home';
import {InboxIcon} from '@ui/icons/material/Inbox';
import {Inventory2Icon} from '@ui/icons/material/Inventory2';
import {SellIcon} from '@ui/icons/material/Sell';
import {SupervisorAccountIcon} from '@ui/icons/material/SupervisorAccount';
import {SvgIconProps} from '@ui/icons/svg-icon';
import {UnassignedIcon} from '@ui/icons/unassigned';

export const dashboardIcons = {
  inbox: InboxIcon,
  archive: Inventory2Icon,
  unassigned: UnassignedIcon,
  home: HomeIcon,
  label: SellIcon,
  bookmark: BookmarkBorderIcon,
  chats: MessagesSquareIcon,
  campaigns: MousePointerClickIcon,
  aiAgent: ChatbotIcon,
  team: GroupIcon,
  reports: ChartNoAxesCombinedIcon,
  library: LibraryIcon,
  users: AccountCircleIcon,
  views: DashboardIconMaterial,
  saveReplies: ChatPasteGoIcon,
  favorite: FavoriteBorderIcon,
  trash: DeleteIcon,
  status: FlagIcon,
  assign: SupervisorAccountIcon,
};

export type DashboardIconName = keyof typeof dashboardIcons;

interface Props {
  name: DashboardIconName;
  size?: SvgIconProps['size'];
}
export function DashboardIcon({name, size = 'md'}: Props) {
  if (!name) return null;
  const Icon = dashboardIcons[name];
  return Icon ? <Icon size={size} /> : null;
}
