<?php

namespace Ai\AiAgent\Flows\Nodes;

enum NodeType: string
{
    case start = 'start';
    case message = 'message';
    case buttons = 'buttons';
    case buttonsItem = 'buttonsItem';
    case articles = 'articles';
    case cards = 'cards';
    case transfer = 'transfer';
    case tool = 'tool';
    case branches = 'branches';

    case unknown = 'unknown';

    /**
     * @return class-string<BaseNode>
     */
    public function getNode(): string
    {
        return match ($this) {
            self::message => MessageNode::class,
            self::buttons => ButtonsNode::class,
            self::articles => ArticlesNode::class,
            self::cards => CardsNode::class,
            self::start => StartNode::class,
            self::transfer => TransferNode::class,
            self::tool => ToolNode::class,
            self::branches => BranchesNode::class,
            default => UnknownNode::class,
        };
    }
}
