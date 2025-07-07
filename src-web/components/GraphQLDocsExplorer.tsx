/* eslint-disable */
import { Color } from '@yaakapp-internal/plugins';
import classNames from 'classnames';
import type { GraphQLField, GraphQLInputField, GraphQLType } from 'graphql';
import {
  getNamedType,
  isInputObjectType,
  isListType,
  isNonNullType,
  isObjectType,
  isScalarType,
  isEnumType,
  isUnionType,
  isInterfaceType,
} from 'graphql';
import { useAtomValue } from 'jotai';
import { ReactNode, useState } from 'react';
import { graphqlSchemaAtom } from '../atoms/graphqlSchemaAtom';
import { Icon } from './core/Icon';
import { Markdown } from './Markdown';

type ExplorerItem =
  | { kind: 'type'; type: GraphQLType; from: ExplorerItem }
  | { kind: 'field'; type: GraphQLField<any, any>; from: ExplorerItem }
  | { kind: 'input_field'; type: GraphQLInputField; from: ExplorerItem }
  | null;

export function GraphQLDocsExplorer() {
  const graphqlSchema = useAtomValue(graphqlSchemaAtom);
  const [activeItem, setActiveItem] = useState<ExplorerItem>(null);

  if (!graphqlSchema) {
    return <div className="p-4">No GraphQL schema available</div>;
  }

  const qryType = graphqlSchema.getQueryType();
  const mutType = graphqlSchema.getMutationType();
  const subType = graphqlSchema.getSubscriptionType();

  const qryItem: ExplorerItem = qryType ? { kind: 'type', type: qryType, from: null } : null;
  const mutItem: ExplorerItem = mutType ? { kind: 'type', type: mutType, from: null } : null;
  const subItem: ExplorerItem = subType ? { kind: 'type', type: subType, from: null } : null;
  const allTypes = graphqlSchema.getTypeMap();

  return (
    <div>
      {activeItem == null ? (
        <div className="flex flex-col gap-3">
          <Subheading>Root Types</Subheading>
          <GqlTypeRow name="query" item={qryItem} setItem={setActiveItem} className="!my-0" />
          <GqlTypeRow name="mutation" item={mutItem} setItem={setActiveItem} className="!my-0" />
          <GqlTypeRow
            name="subscription"
            item={subItem}
            setItem={setActiveItem}
            className="!my-0"
          />
          <Subheading>All Schema Types</Subheading>
          {Object.keys(allTypes).map((typeName) => {
            const t = allTypes[typeName]!;
            return (
              <GqlTypeLink
                color="notice"
                item={{ kind: 'type', type: t, from: null }}
                setItem={setActiveItem}
              />
            );
          })}
        </div>
      ) : (
        <div className="h-full grid grid-rows-[auto_minmax(0,1fr)] gap-y-3">
          <GraphQLExplorerHeader item={activeItem} setItem={setActiveItem} />
          <div className="overflow-auto h-full max-h-full">
            <GqlTypeInfo item={activeItem} setItem={setActiveItem} />
          </div>
        </div>
      )}
    </div>
  );
}

function GraphQLExplorerHeader({
  item,
  setItem,
}: {
  item: ExplorerItem;
  setItem: (t: ExplorerItem) => void;
}) {
  if (item == null) return null;

  return (
    <nav className="flex items-center gap-1">
      <Icon icon="chevron_left" color="secondary" />
      <GqlTypeLink item={item.from} setItem={setItem} />
    </nav>
  );
}

function GqlTypeInfo({
  item,
  setItem,
}: {
  item: ExplorerItem | null;
  setItem: (t: ExplorerItem) => void;
}) {
  const graphqlSchema = useAtomValue(graphqlSchemaAtom);
  if (item == null) return null;

  const name = item.kind === 'type' ? getNamedType(item.type).name : item.type.name;
  const description =
    item.kind === 'type' ? getNamedType(item.type).description : item.type.description;

  const heading = (
    <div className="mb-3">
      <h1 className="text-2xl font-semibold">{name}</h1>
      <Markdown className="!text-text-subtle italic">{description ?? 'No description'}</Markdown>
    </div>
  );

  if (isScalarType(item.type)) {
    return heading;
  } else if (isInterfaceType(item.type)) {
    const fields = item.type.getFields();
    const possibleTypes = graphqlSchema?.getPossibleTypes(item.type) ?? [];

    return (
      <div>
        {heading}

        <Subheading>Fields</Subheading>
        {Object.keys(fields).map((fieldName) => {
          const field = fields[fieldName]!;
          const fieldItem: ExplorerItem = { kind: 'field', type: field, from: item };
          return (
            <div key={`${field.type}::${field.name}`} className="my-4">
              <GqlTypeRow item={fieldItem} setItem={setItem} name={fieldName} />
            </div>
          );
        })}

        {possibleTypes.length > 0 && (
          <>
            <Subheading>Implemented By</Subheading>
            {possibleTypes.map((t) => (
              <GqlTypeRow
                key={t.name}
                item={{ kind: 'type', type: t, from: item }}
                setItem={setItem}
              />
            ))}
          </>
        )}
      </div>
    );
  } else if (isUnionType(item.type)) {
    const types = item.type.getTypes();

    return (
      <div>
        {heading}

        <Subheading>Possible Types</Subheading>
        {types.map((t) => (
          <GqlTypeRow key={t.name} item={{ kind: 'type', type: t, from: item }} setItem={setItem} />
        ))}
      </div>
    );
  } else if (isEnumType(item.type)) {
    const values = item.type.getValues();

    return (
      <div className="flex flex-col gap-3">
        {heading}

        <div>
          <Subheading>Type</Subheading>
          <GqlTypeRow item={{ kind: 'type', type: item.type, from: item }} setItem={setItem} />
        </div>

        <div>
          <Subheading>Values</Subheading>
          {values.map((v) => (
            <div key={v.name} className="my-4">
              <span className="text-primary">{v.value}</span>
              <Markdown className="!text-text-subtle">{v.description ?? ''}</Markdown>
            </div>
          ))}
        </div>
      </div>
    );
  } else if (item.kind === 'field') {
    return (
      <div className="flex flex-col gap-3">
        {heading}

        <div>
          <Subheading>Type</Subheading>
          <GqlTypeRow item={{ kind: 'type', type: item.type.type, from: item }} setItem={setItem} />
        </div>

        {item.type.args.length > 0 && (
          <div>
            <Subheading>Arguments</Subheading>
            {item.type.args.map((a) => (
              <div key={a.type + '::' + a.name} className="my-4">
                <GqlTypeRow
                  name={a.name}
                  item={{ kind: 'input_field', type: a, from: item }}
                  setItem={setItem}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  } else if (item.kind === 'input_field' && isInputObjectType(item.type)) {
    const fields = item.type.getFields();
    return (
      <div>
        {heading}

        <Subheading>Fields</Subheading>
        {Object.keys(fields).map((fieldName) => {
          const field = fields[fieldName];
          if (field == null) return null;
          const fieldItem: ExplorerItem = {
            kind: 'input_field',
            type: field,
            from: item,
          };
          return (
            <div key={`${field.type}::${field.name}`} className="my-4">
              <GqlTypeRow item={fieldItem} setItem={setItem} name={fieldName} />
            </div>
          );
        })}
      </div>
    );
  } else if (item.kind === 'type' && isInputObjectType(item.type)) {
    const fields = item.type.getFields();
    return (
      <div>
        {heading}

        <Subheading>Fields</Subheading>
        {Object.keys(fields).map((fieldName) => {
          const field = fields[fieldName];
          if (field == null) return null;
          const fieldItem: ExplorerItem = {
            kind: 'input_field',
            type: field,
            from: item,
          };
          return (
            <div key={`${field.type}::${field.name}`} className="my-4">
              <GqlTypeRow item={fieldItem} setItem={setItem} name={fieldName} />
            </div>
          );
        })}
      </div>
    );
  } else if (item.kind === 'type' && isObjectType(item.type)) {
    const fields = item.type.getFields();

    return (
      <div>
        {heading}

        <Subheading>Fields</Subheading>
        {Object.keys(fields).map((fieldName) => {
          const field = fields[fieldName];
          if (field == null) return null;
          const fieldItem: ExplorerItem = { kind: 'field', type: field, from: item };
          return (
            <div key={`${field.type}::${field.name}`} className="my-4">
              <GqlTypeRow item={fieldItem} setItem={setItem} name={fieldName} />
            </div>
          );
        })}
      </div>
    );
  }

  console.log('Unknown GraphQL Type', item);
  return <div>Unknown GraphQL type</div>;
}

function GqlTypeRow({
  item,
  setItem,
  name,
  description,
  className,
  hideDescription,
}: {
  item: ExplorerItem;
  name?: string;
  description?: string | null;
  setItem: (t: ExplorerItem) => void;
  className?: string;
  hideDescription?: boolean;
}) {
  if (item == null) return null;

  let child: ReactNode = <>Unknown Type</>;

  if (item.kind === 'type') {
    child = (
      <>
        <div>
          {name && <span className="text-primary">{name}:</span>}{' '}
          <GqlTypeLink color="notice" item={item} setItem={setItem} />
        </div>
        {!hideDescription && (
          <Markdown className="!text-text-subtle">
            {(description === undefined ? getNamedType(item.type).description : description) ?? ''}
          </Markdown>
        )}
      </>
    );
  } else if (item.kind === 'field') {
    const returnItem: ExplorerItem = {
      kind: 'type',
      type: item.type.type,
      from: item.from,
    };
    child = (
      <div>
        <div>
          <GqlTypeLink color="info" item={item} setItem={setItem}>
            {name}
          </GqlTypeLink>
          {item.type.args.length > 0 && (
            <>
              <span className="text-text-subtle">(</span>
              {item.type.args.map((arg) => (
                <div
                  key={`${arg.type}::${arg.name}`}
                  className={classNames(item.type.args.length == 1 ? 'inline' : 'pl-3')}
                >
                  <span className="text-primary">{arg.name}:</span>{' '}
                  <GqlTypeLink
                    color="notice"
                    item={{ kind: 'type', type: arg.type, from: item.from }}
                    setItem={setItem}
                  />
                </div>
              ))}
              <span className="text-text-subtle">)</span>{' '}
            </>
          )}
          <span className="text-text-subtle">:</span>{' '}
          <GqlTypeLink color="notice" item={returnItem} setItem={setItem} />
        </div>
        {item.type.description && (
          <Markdown className="!text-text-subtle mt-0.5">{item.type.description}</Markdown>
        )}
      </div>
    );
  } else if (item.kind === 'input_field') {
    child = (
      <>
        <div>
          {name && <span className="text-primary">{name}:</span>}{' '}
          <GqlTypeLink color="notice" item={item} setItem={setItem} />
        </div>
        {item.type.description && (
          <Markdown className="!text-text-subtle">{item.type.description}</Markdown>
        )}
      </>
    );
  }

  return <div className={className}>{child}</div>;
}

function GqlTypeLink({
  item,
  setItem,
  color,
  children,
}: {
  item: ExplorerItem;
  color?: Color;
  setItem: (item: ExplorerItem) => void;
  children?: string;
}) {
  if (item?.kind === 'type' && isListType(item.type)) {
    return (
      <>
        <span className="text-text-subtle">[</span>
        <GqlTypeLink item={{ ...item, type: item.type.ofType }} setItem={setItem} color={color}>
          {children}
        </GqlTypeLink>
        <span className="text-text-subtle">]</span>
      </>
    );
  } else if (item?.kind === 'type' && isNonNullType(item.type)) {
    return (
      <>
        <GqlTypeLink item={{ ...item, type: item.type.ofType }} setItem={setItem} color={color}>
          {children}
        </GqlTypeLink>
        <span className="text-text-subtle">!</span>
      </>
    );
  }

  return (
    <button
      className={classNames(
        'hover:underline text-left mr-auto',
        color === 'danger' && 'text-danger',
        color === 'primary' && 'text-primary',
        color === 'success' && 'text-success',
        color === 'warning' && 'text-warning',
        color === 'notice' && 'text-notice',
        color === 'info' && 'text-info',
      )}
      onClick={() => setItem(item)}
    >
      <GqlTypeLabel item={item} children={children} />
    </button>
  );
}

function GqlTypeLabel({ item, children }: { item: ExplorerItem; children?: string }) {
  let inner;
  if (children) {
    inner = children;
  } else if (item == null) {
    inner = 'Root';
  } else if (item.kind === 'type') {
    inner = getNamedType(item.type).name;
  } else {
    inner = getNamedType(item.type.type).name;
  }

  return <>{inner}</>;
}

function Subheading({ children }: { children: ReactNode }) {
  return <h2 className="font-bold text-lg mt-6">{children}</h2>;
}
