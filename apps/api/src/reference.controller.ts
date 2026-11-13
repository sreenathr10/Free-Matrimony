import { Controller, Get, Header } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { COMMUNITIES, COMMUNITY_LABEL, OTHER_COMMUNITY, SUB_COMMUNITY_LABEL } from '@fm/shared';

/** Lists the apps show in pickers. Public, so sign-up screens can use them; the web apps import them from @fm/shared directly. */
@ApiTags('Reference')
@Controller('reference')
export class ReferenceController {
  @Get('communities')
  @Header('Cache-Control', 'public, max-age=3600')
  @ApiOperation({ summary: 'Castes, denominations and sub-castes for each religion' })
  @ApiOkResponse({
    description:
      '{ religions: { HINDU: { label, subLabel, communities: [{ name, subs?, aliases?, outsideKerala? }] } }, other }',
  })
  communities() {
    return {
      other: OTHER_COMMUNITY,
      religions: Object.fromEntries(
        Object.entries(COMMUNITIES).map(([religion, communities]) => [
          religion,
          {
            label: COMMUNITY_LABEL[religion as keyof typeof COMMUNITY_LABEL],
            subLabel: SUB_COMMUNITY_LABEL[religion as keyof typeof SUB_COMMUNITY_LABEL],
            communities,
          },
        ]),
      ),
    };
  }
}
