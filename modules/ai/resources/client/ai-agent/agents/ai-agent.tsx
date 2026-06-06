import React from 'react';
import { AiAgent } from './use-ai-agents';
import { IconButton } from '@ui/buttons/icon-button';
import { EditIcon } from '@ui/icons/material/Edit';
import { DeleteIcon } from '@ui/icons/material/Delete';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import {EditAiAgentDialog} from './edit-ai-agent-dialog';
import {DeleteAiAgentDialog} from './delete-ai-agent-dialog';

interface Props {
  agent: AiAgent;
}

export function AiAgent({ agent }: Props) {
  return (
    <div className="flex gap-2">
      <DialogTrigger type="modal">
        <IconButton size="sm">
          <EditIcon />
        </IconButton>
        <EditAiAgentDialog agent={agent} />
      </DialogTrigger>
      <DialogTrigger type="modal">
        <IconButton size="sm" color="danger">
          <DeleteIcon />
        </IconButton>
        <DeleteAiAgentDialog agent={agent} />
      </DialogTrigger>
    </div>
  );
}